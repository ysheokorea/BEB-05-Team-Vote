import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import * as Sentry from '@sentry/react';
import { Courses } from '../';
import {
  Row,
  Col,
  PageHeader,
  Space,
  Typography,
  Divider,
  Image,
  Button,
  notification,
  Popconfirm,
} from 'antd';
import { CodepenOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useRecoilState } from 'recoil';
import { loginInfoState } from '../../../states/loginInfoState';
import { useRouter } from 'next/router';
import { getSession, useSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import { useSWRConfig } from 'swr';
import { HADAPassState } from '../../../states/HADAPassState';

const { Title, Paragraph, Text } = Typography;

interface CourseDetail extends Courses {
  user_id: number;
  lecture_summary: string;
  lecture_introduction: string;
  instructor_introduction: string;
  lecture_url: string;
  created_at: string;
  updated_at: string;
}

export default function Detail({
  course,
  subscribe,
}: {
  course: CourseDetail;
  subscribe: boolean;
}) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { data: session } = useSession();

  const [HADAPASS, setIsPass] = useRecoilState(HADAPassState);
  const [isSubscribe, setIsSubscribe] = useState(subscribe || false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginInfo, setLoginInfo] = useRecoilState(loginInfoState);

  useEffect(() => {
    if (session) {
      getBalanceNFT();
    }
  }, []);

  const onSubscribe = async () => {
    if (!session) {
      return notification['info']({
        message: '지갑 연동이 필요합니다.',
        description: '이 강의를 수강하시려면 먼저 지갑을 연동해주세요.',
      });
    }
    setIsLoading(true);

    if (HADAPASS.isPass) {
      saveSubscribeToDB();
      return;
    }
    if (course.lecture_price === 0) {
      saveSubscribeToDB();
    } else {
      const walletState = window.klaytn.publicConfigStore.getState();
      if (walletState.isUnlocked === false) {
        setIsLoading(false);
        window.klaytn.enable();
        return notification['info']({
          message: '지갑이 잠겨있습니다.',
          description: '이 강의를 수강하시려면 먼저 지갑의 잠금을 해제해주세요.',
        });
      }

      const data = window.caver.klay.abi.encodeFunctionCall(
        {
          name: 'transfer',
          type: 'function',
          inputs: [
            {
              type: 'address',
              name: 'recipient',
            },
            {
              type: 'uint256',
              name: 'amount',
            },
          ],
        },
        [
          course.user.user_address,
          window.caver.utils
            .toBN(course.lecture_price)
            .mul(window.caver.utils.toBN(Number(`1e18`)))
            .toString(),
        ]
      );

      window.caver.klay
        .sendTransaction({
          type: 'SMART_CONTRACT_EXECUTION',
          from: loginInfo.user_address,
          to: process.env.NEXT_PUBLIC_HADATOKEN,
          data,
          gas: '3000000',
        })
        .on('transactionHash', (transactionHash: any) => {
          console.log('txHash', transactionHash);
        })
        .on('receipt', (receipt: any) => {
          console.log('receipt', receipt);
          saveSubscribeToDB();
        })
        .on('error', (error: any) => {
          setIsLoading(false);
          console.log('error', error.message);
          Sentry.captureException(error.message);
          cancelSubscribeOnWallet();
        });
    }
  };

  const saveSubscribeToDB = async () => {
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_ENDPOINT}/userlecture`, {
        user_id: loginInfo.user_id,
        lecture_id: course.lecture_id,
      });
      if (res.status === 201) {
        setIsLoading(false);
        notification['success']({
          message: '수강 신청이 완료되었습니다!',
        });
        setIsSubscribe(true);
      }
    } catch (error) {
      setIsLoading(false);
      // setIsSubscribe(false);
      Sentry.captureException(error);
    }
  };

  const changeLoginState = async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_ENDPOINT}/userlecture?user_id=${session?.user.user_id}&lecture_id=${course.lecture_id}`
    );
    const subscribe = res.data.length !== 0;
    setIsSubscribe(subscribe);
  };

  useEffect(() => {
    if (session) {
      changeLoginState();
    }
  }, [session]);

  const cancelSubscribeOnWallet = () => {
    notification['error']({
      message: '수강 신청이 실패되었습니다.',
    });
  };

  const onDelete = async (lecture_id: number) => {
    const res = await axios.delete(`${process.env.NEXT_PUBLIC_ENDPOINT}/lecture`, {
      data: {
        user_id: loginInfo.user_id,
        lecture_id: lecture_id,
      },
    });
    if (res.status === 201) {
      notification['success']({
        message: '강의가 성공적으로 삭제되었습니다.',
      });
      router.push('/courses');
      mutate(`${process.env.NEXT_PUBLIC_ENDPOINT}/lecture`);
    }
  };

  const onClick = () => {
    router.push({
      pathname: `/courses/class/${course.lecture_id}`,
      query: {
        lecture_id: course.lecture_id,
        lecture_title: course.lecture_title,
        lecture_summary: course.lecture_summary,
        lecture_url: course.lecture_url,
      },
    });
  };

  const getBalanceNFT = async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_ENDPOINT}/nft?user_address=${loginInfo.user_address}`
      );
      if (res.status === 201) {
        const isPass = Number(res.data) > 0;
        setIsPass({ isPass: isPass });
      }
    } catch (error) {
      Sentry.captureException(error);
    }
  };

  return (
    <section>
      {course ? (
        <>
          <Space style={{ width: '100%' }}>
            <PageHeader
              title="목록으로"
              style={{ paddingLeft: 0 }}
              onBack={() => router.push('/courses')}
            />
          </Space>
          <Row gutter={48}>
            <Col span={16}>
              <Image
                width={'100%'}
                src={course.lecture_image}
                style={{ marginBottom: '24px' }}
                preview={false}
                alt="강의 이미지"
                fallback="https://images.unsplash.com/photo-1534337621606-e3df5ee0e97f?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1332&q=80"
              />
              <Title level={3}>강의 상세 소개</Title>
              <Paragraph style={{ fontSize: '16px', fontWeight: 400 }}>
                {course.lecture_introduction}
              </Paragraph>
              <Divider />
              <Title level={3}>강사 소개</Title>
              <Paragraph style={{ fontSize: '16px', fontWeight: 400 }}>
                {course.instructor_introduction}
              </Paragraph>
              <Divider />
            </Col>
            <Col span={8}>
              <Title level={3}>{course.lecture_title}</Title>
              <Paragraph style={{ fontSize: '16px', fontWeight: 400 }}>
                {course.lecture_summary}
              </Paragraph>

              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  {course.lecture_price === 0 ? (
                    <Text style={{ fontSize: '20px', color: '#bae637', fontWeight: 500 }}>
                      무료
                    </Text>
                  ) : HADAPASS.isPass ? (
                    <Text type="success" style={{ fontSize: '16px' }}>
                      HADA PASS 보유 중! 자유롭게 수강하세요!
                    </Text>
                  ) : (
                    <>
                      <CodepenOutlined style={{ fontSize: '24px', color: '#bae637' }} />
                      <Text style={{ fontSize: '20px', color: '#bae637', fontWeight: 500 }}>
                        {course.lecture_price}
                      </Text>
                    </>
                  )}
                </Space>
                {isSubscribe && session ? (
                  <Button
                    onClick={onClick}
                    type="ghost"
                    size={'large'}
                    style={{ width: '100%' }}
                    block
                  >
                    강의실로 이동하기
                  </Button>
                ) : isLoading ? (
                  <Button type="primary" size={'large'} style={{ width: '100%' }} block loading>
                    <span>수강 신청 중..</span>
                  </Button>
                ) : (
                  <Button
                    onClick={onSubscribe}
                    type="primary"
                    size={'large'}
                    style={{ width: '100%' }}
                    block
                  >
                    수강 신청 하기
                  </Button>
                )}
                {session?.user.user_id === course.user_id ? (
                  <Popconfirm
                    placement="bottom"
                    title={'정말 강의를 삭제하시겠습니까?'}
                    onConfirm={() => onDelete(course.lecture_id)}
                    okText={'삭제'}
                    cancelText="취소"
                    icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                  >
                    <Button type={'text'} danger size={'large'} style={{ width: '100%' }} block>
                      강의 삭제하기
                    </Button>
                  </Popconfirm>
                ) : (
                  <></>
                )}
              </Space>
            </Col>
          </Row>
        </>
      ) : (
        <></>
      )}
    </section>
  );
}
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  try {
    if (ctx.params?.id) {
      const resCourse = await axios.get(
        `${process.env.NEXT_PUBLIC_ENDPOINT}/lecture/detail?lecture_id=${ctx.params?.id}`
      );
      const course = resCourse.data[0];

      const session = await getSession(ctx);

      if (session?.user) {
        const resSubscribe = await axios.get(
          `${process.env.NEXT_PUBLIC_ENDPOINT}/userlecture?user_id=${session.user.user_id}&lecture_id=${ctx.params?.id}`
        );
        const subscribe = resSubscribe.data.length !== 0;

        return {
          props: {
            course,
            subscribe,
          },
        };
      }

      return {
        props: {
          course,
        },
      };
    } else {
      return {
        props: {
          course: undefined,
        },
      };
    }
  } catch (error) {
    Sentry.captureException(error);
    return { props: {} };
  }
};

import {
  ArrowRightOutlined,
  CommentOutlined,
  DeleteOutlined,
  FireOutlined,
  LikeOutlined,
  MessageOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Col,
  PageHeader,
  Row,
  Radio,
  Typography,
  Card,
  Space,
  Button,
  Skeleton,
  Popconfirm,
  notification,
  message,
} from 'antd';
import type { NextPage } from 'next';
import UploadPost from '../components/community/UploadPost';
import RcmdCourse from '../components/RcmdCourse';
import styled from 'styled-components';
import { loginInfoState } from '../states/loginInfoState';
import { useRecoilState } from 'recoil';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import axios from 'axios';
import { useSWRConfig } from 'swr';
import { timeForToday } from '../lib/date';
import { useSession } from 'next-auth/react';

export interface PostInterface {
  article_id: number;
  user_id: number;
  article_content: string;
  like_count: number;
  comment_count: number;
  comment_content: string;
  created_at: string;
  id: number;
  user: {
    user_id: number;
    user_address: string;
    user_network: string;
    user_nickname: string;
    user_introduction: string;
    created_at: string;
    updated_at: string;
  };
}

const { Text, Paragraph } = Typography;

const Home: NextPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [loginInfo, setLoginInfo] = useRecoilState(loginInfoState);
  const { mutate } = useSWRConfig();

  const { data: postList } = useSWR(`${process.env.NEXT_PUBLIC_ENDPOINT}/article/recent`, {
    refreshInterval: 10000,
  });

  const fetchLike = async (article_id: number) => {
    if (session) {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_ENDPOINT}/like`, {
        user_id: loginInfo.user_id,
        article_id: article_id,
      });
      if (res.status === 201) {
        mutate(`${process.env.NEXT_PUBLIC_ENDPOINT}/article/recent`);
      }
    }
  };

  const onPostDelete = async (article_id: number) => {
    const res = await axios.delete(`${process.env.NEXT_PUBLIC_ENDPOINT}/article`, {
      data: {
        user_id: loginInfo.user_id,
        article_id: article_id,
      },
    });
    if (res.status === 201) {
      notification['success']({
        message: '???????????? ??????????????? ?????????????????????.',
      });
      mutate(`${process.env.NEXT_PUBLIC_ENDPOINT}/article/recent`);
    }
  };

  return (
    <div>
      <Row>
        <Col xl={16} xs={24}>
          <PageHeader
            backIcon={<CommentOutlined />}
            onBack={() => router.push('/')}
            title="???????????? ????????????"
            subTitle={'?????? ???????????? ???????????? ???????????? ???????????????.'}
            // extra={
            //   <Radio.Group defaultValue="a" size={'small'}>
            //     <Radio.Button onClick={() => {}} value="a">
            //       ??????
            //     </Radio.Button>
            //     <Radio.Button onClick={() => {}} value="b">
            //       ??????
            //     </Radio.Button>
            //   </Radio.Group>
            // }
          />
          {session ? (
            <UploadPost />
          ) : (
            <Space
              align="center"
              style={{
                width: '100%',
                justifyContent: 'center',
                paddingTop: '20px',
                paddingBottom: '40px',
              }}
            >
              <Text style={{ fontSize: '20px' }}>
                ?????? ????????? ????????????
                <br />
                ???????????? ????????? ??????????????????.
              </Text>
            </Space>
          )}

          {postList ? (
            postList.map((post: PostInterface) => {
              return (
                <div
                  key={post.article_id}
                  onClick={() => router.push(`/community/details/${post.article_id}`)}
                >
                  <PostCard>
                    <Space direction="vertical" size={'large'} style={{ width: '100%' }}>
                      <Space>
                        <Popconfirm
                          title={
                            <>
                              <Paragraph>{post.user.user_nickname}</Paragraph>
                              <Paragraph>{post.user.user_introduction}</Paragraph>
                              <Paragraph>{post.user.user_address}</Paragraph>
                            </>
                          }
                          icon={<UserOutlined style={{ color: '#bfbfbf' }} />}
                          okText="?????? ?????? ??????"
                          cancelText="??????"
                          onConfirm={(e) => {
                            e?.stopPropagation();
                            navigator.clipboard.writeText(post.user.user_address);
                            message.success('?????? ????????? ?????????????????????!');
                          }}
                          onCancel={(e) => {
                            e?.stopPropagation();
                          }}
                        >
                          <Text type="secondary" strong onClick={(e) => e?.stopPropagation()}>
                            {post.user.user_nickname}
                          </Text>
                        </Popconfirm>
                        <Text type="secondary">{timeForToday(post.created_at)}</Text>
                      </Space>
                      <Paragraph ellipsis={{ rows: 4, expandable: true, symbol: 'more' }}>
                        {' '}
                        {post.article_content}
                      </Paragraph>
                      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                        <Space size={'large'}>
                          <Button
                            type="link"
                            icon={<LikeOutlined />}
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              fetchLike(post.article_id);
                            }}
                          >
                            {' '}
                            {post.like_count}
                          </Button>
                          <Button type="link" icon={<MessageOutlined />} size="small">
                            {' '}
                            {post.comment_count}
                          </Button>
                        </Space>
                        {post.user_id === session?.user.user_id && (
                          <div onClick={(e) => e.stopPropagation()}>
                            <Popconfirm
                              title="?????? ???????????? ?????????????????????????"
                              onConfirm={() => onPostDelete(post.article_id)}
                              okText="??????"
                              cancelText="??????"
                            >
                              <DeleteOutlined style={{ color: '#ff7875' }} />
                            </Popconfirm>
                          </div>
                        )}
                      </Space>
                    </Space>
                  </PostCard>
                </div>
              );
            })
          ) : (
            <></>
          )}
        </Col>
        <Col xl={8} xs={0}>
          <PageHeader
            backIcon={<FireOutlined />}
            onBack={() => null}
            title="????????????"
            extra={
              <div
                style={{ cursor: 'pointer' }}
                title="?????? ?????? ??????"
                onClick={() => router.push('/courses')}
                key={1}
              >
                <ArrowRightOutlined /> ?????????
              </div>
            }
          />
          <RcmdCourse />
        </Col>
      </Row>
    </div>
  );
};

const PostCard = styled(Card)`
  width: 100%;
  margin-top: -1px;

  :hover {
    cursor: pointer;
    background-color: rgba(200, 200, 200, 0.1);
  }
`;

export default Home;

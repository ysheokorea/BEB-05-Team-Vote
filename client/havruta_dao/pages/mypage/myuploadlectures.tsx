import { Col, Image, PageHeader, Row, Space, Typography } from 'antd';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import { loginInfoState } from '../../states/loginInfoState';
import { useRecoilState } from 'recoil';
import { CodepenOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function MyUploadLectures() {
  const router = useRouter();
  const [loginInfo, setLoginInfo] = useRecoilState(loginInfoState);

  const { data: createdLecture } = useSWR(
    `${process.env.NEXT_PUBLIC_ENDPOINT}/user/userlecture?user_id=${loginInfo.user_id}`
  );

  return (
    <Space direction="vertical">
      <PageHeader
        className="site-page-header"
        // onBack={() => ('/mypage')}
        onBack={() => router.push('/mypage')}
        title="내가 생성한 강의"
        subTitle="내가 생성한 강의 목록입니다."
        style={{ paddingLeft: 0 }}
      />
      <Space
        style={{
          width: '100%',
          border: '1px solid grey',
          padding: '16px',
          borderRadius: '8px',
        }}
      >
        <Row gutter={[24, 24]}>
          {createdLecture &&
            createdLecture.map((item: any) => {
              return (
                <Col
                  span={6}
                  key={item.lecture_id}
                  onClick={() => {
                    router.push(`/courses/details/${item.lecture_id}`);
                  }}
                >
                  <Space direction="vertical">
                    <Image
                      width={'100%'}
                      height={'auto'}
                      style={{
                        objectFit: 'cover',
                        marginBottom: '8px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                      // onClick={() => router.push(`/courses/details/`)}
                      src={item.lecture_image}
                      alt={item.lecture_title}
                      preview={false}
                      fallback="https://images.unsplash.com/photo-1534337621606-e3df5ee0e97f?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1332&q=80"
                    />

                    <Space>
                      <Title
                        ellipsis={{ rows: 2 }}
                        level={4}
                        style={{ lineHeight: '150%', cursor: 'pointer' }}
                      >
                        {item.lecture_title}
                      </Title>
                      <Space style={{ width: '80px' }}>
                        <Text
                          style={{ fontSize: '16px', color: '#bae637', fontWeight: 500 }}
                          type="secondary"
                        >
                          <CodepenOutlined style={{ fontSize: '24px', color: '#bae637' }} />
                          &nbsp;
                          {item.lecture_price}
                        </Text>
                      </Space>
                    </Space>
                  </Space>
                </Col>
              );
            })}
        </Row>
      </Space>
    </Space>
  );
}

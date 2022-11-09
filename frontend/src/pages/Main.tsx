import React from 'react';
import { Alert, Layout, Image, Button, Typography, Card, Col, Row } from 'antd';

import './Main.scss';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text, Link } = Typography;

export default function Main() {
    return (
        <Layout className="layout">
            <Header>
                <div className="logo">
                    달달이봇
                </div>
            </Header>
            <Content className="site-layout-content-wrapper">
                <div className="site-layout-content">
                    <div className={"logo-header-wrapper"}>
                        <Image
                            width={200}
                            src={"./images/daldalee.png"}
                            className={"logo-img"}
                        />
                        <Title level={3}>달달이봇</Title>
                        <p className="lead">파이널판타지 14 공식 홈페이지 소식과 아이템 검색, 패션체크 등<br/>디스코드에서 실시간으로 이용해보세요!</p>

                        <Button type={"primary"} href={"https://discord.com/api/oauth2/authorize?client_id=994586249690095666&permissions=0&redirect_uri=http%3A%2F%2Flocalhost%2Fwebhook%2Fsave&response_type=code&scope=bot%20webhook.incoming%20messages.read%20applications.commands"}>봇 추가하기</Button>
                    </div>
                    <div className={"feature-content"}>
                        <Typography>
                            <Title level={2}>소개</Title>
                            <Paragraph>
                                2019년도에 심심풀이로 만들었다가 글로벌과 한국 서비스의 소식이라던지 아이템 검색 또는 프프로그 조회 기능(현재는 지원하지 않습니다) 등을 지인들과 함께 이용할 수 있도록 만들어진 디스코드 봇입니다.
                            </Paragraph>
                            <Row gutter={16}>
                                <Col xs={24} lg={12} xl={12} xxl={8}>
                                    <Card title="글로벌, 한국 서비스 소식 구독" bordered={false}>
                                        <Image
                                            width={300}
                                            src={"./images/notify.jpg"}
                                        />
                                        <Paragraph>글로벌, 한국 서비스의 소식을 체크하여 게시글을 올려줍니다.</Paragraph>
                                    </Card>
                                </Col>
                                <Col xs={24} lg={12} xl={12} xxl={8}>
                                    <Card title="아이템 검색" bordered={false}>
                                        <Image
                                            width={300}
                                            src={"./images/itemsearch.jpg"}
                                        />
                                        <Paragraph>아이템 검색 기능을 지원합니다.</Paragraph>
                                    </Card>
                                </Col>
                                <Col xs={24} lg={12} xl={12} xxl={8}>
                                    <Card title="시장 검색 (글로벌만 지원)" bordered={false}>
                                        <Image
                                            width={300}
                                            src={"./images/market.jpg"}
                                        />
                                        <Paragraph>시장 검색 기능을 지원합니다.</Paragraph>
                                    </Card>
                                </Col>
                            </Row>
                            <p>추후에도 필요한 기능을 계속해서 확장하여 추가할 예정입니다.</p>

                            <Title level={2}>사용 방법</Title>
                            <p>1. 위에 있는 <Text code>봇 추가하기</Text> 버튼을 누릅니다.</p>
                            <p>2. 달달이봇을 추가할 서버를 선택합니다.</p>
                            <Image src="./images/1.png" alt="달달이봇을 추가할 서버를 선택합니다."/>
                            <p>
                                3. 달달이봇이 소식을 전해줄 채팅 채널을 골라주세요.
                                <br/>
                                <Alert message="기본적으로 북미, 한국 소식을 가져옵니다." type="info" showIcon />
                                <Alert message="나중에 소식 종류를 /소식추가 와 /소식삭제 명령어를 이용해서 고를 수 있습니다." type="info" showIcon />
                            </p>
                            <Image src="./images/2.png" alt="달달이봇이 소식을 전해줄 채팅 채널을 골라주세요."/>

                            <Title level={2}>권한 안내</Title>
                            <dl>
                                <dt><b>모든 메시지 읽기</b></dt>
                                <dd>디스코드에서는 공식적으로 슬래시(<Text code>/</Text>) 를 이용하여 봇의 명령어를 이용할 수 있도록 제공하고 있으나, 예전에는 <Text code>!</Text> 와 같은 문자를 붙이는 방식으로 개발자가 직접 지정한 문자로 이용했습니다. 사용자가 입력한 메세지를 읽어야 하고, 기존 시스템의 이용 방식을 유지하기 위해 사용되고 있습니다.</dd>
                                <dt><b>서버에서 명령어를 만들어 보세요.</b></dt>
                                <dd>슬래시(<Text code>/</Text>) 명령어 기능을 이용하려면 필요한 기능입니다.</dd>
                                <dt><b>(???)</b></dt>
                                <dd>공식 홈페이지 소식을 디스코드 특정 채널에 배포하기 위해 필요합니다. 웹훅을 이용하고 있습니다.</dd>
                            </dl>

                            <Title level={2}>명령어 종류</Title>
                            <p>디스코드 내에서 채팅창에 / 를 입력하면 자동적으로 명령어 목록이 나타납니다.</p>
                            <Image src="./images/slashcmds.jpg" alt="디스코드 내에서 채팅창에 / 를 입력하면 자동적으로 명령어 목록이 나타납니다."/>

                            <Title level={4}>소식</Title>
                            <dl>
                                <dt className="text-cmd"><Text code>/소식추가 [언어]</Text></dt>
                                <dd>현재 서버에서 구독중인 소식 카테고리 중 하나를 추가합니다.</dd>
                                <dt className="text-cmd"><Text code>/소식삭제 [언어]</Text></dt>
                                <dd>현재 서버에서 구독중인 소식 카테고리 중 하나를 삭제합니다.</dd>
                            </dl>
                            <Title level={4}>정보 조회</Title>
                            <dl>
                                <dt className="text-cmd"><Text code>/아이템검색 [아이템이름]</Text></dt>
                                <dd>아이템을 검색합니다. 이름을 한글로 적을 경우, 한국 서비스 기준으로 목록이 나타납니다.</dd>
                            </dl>
                            <dl>
                                <dt className="text-cmd"><Text code>/시장 [서버] [아이템이름]</Text></dt>
                                <dd>(글로벌 전용) 현재 시장에 출품되어 있는 아이템의 목록을 조회합니다. 서버는 영문자로 적어야 합니다.<br/>ex) /시장 chocobo coke<br/>정보는 <Link href="https://universalis.app/" target="_blank">Universalis</Link> 에서 가져옵니다.</dd>
                            </dl>
                            <dl>
                                <dt className="text-cmd"><Text code>/상점 [아이템이름]</Text></dt>
                                <dd>아이템이 어느 곳에서 판매 또는 교환하고 있는지 관련 정보를 출력합니다.<br/>정보는 파이널 판타지 14 공식 사이트에서 가져옵니다.</dd>
                            </dl>
                            <Title level={4}>패션체크</Title>
                            <dl>
                                <dt className="text-cmd"><Text code>/패션체크</Text></dt>
                                <dd>이번 주의 패션체크를 확인합니다. 글로벌/한국 서비스 모두 동일합니다.</dd>
                            </dl>
                            <Title level={4}>기타</Title>
                            <dl>
                                <dt className="text-cmd"><Text code>/따라하기 [메세지]</Text></dt>
                                <dd>봇이 사용자의 말을 똑같이 따라합니다.</dd>
                                <dt className="text-cmd"><Text code>/업타임</Text></dt>
                                <dd>서버가 실행된 후 경과된 시간을 출력합니다.</dd>
                            </dl>
                        </Typography>
                    </div>
                </div>
            </Content>
            <Footer className="footer">© 2019-2022 Karsei</Footer>
        </Layout>
    )
}

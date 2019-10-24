import React from 'react'
import { ConfigProvider, Layout } from 'antd'
import { BrowserRouter, Switch, Route } from 'react-router-dom'
import zhCN from 'antd/es/locale/zh_CN'
import Home from './Home'
import Api from './Api'
import Nav from './Nav'

import './app.less'

function App () {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Layout className='app'>
          <Layout.Header>
            <Nav />
          </Layout.Header>
          <Layout.Content className='p-5'>
            <Switch>
              <Route exact path='/'><Home /></Route>
              <Route path='/api'><Api /></Route>
            </Switch>
          </Layout.Content>
          <Layout.Footer className='text-center' data-e2e-test-id='SITE_COPYRIGHT'>请勿上传违反中国大陆法律的图片，违者后果自负。Copyright Ⓒ 2019 tuchuang.space. All rights reserved.</Layout.Footer>
        </Layout>
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App

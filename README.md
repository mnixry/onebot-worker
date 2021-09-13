# OneBot-Worker

> **一个使用Cloudflare Worker实现的OneBot SDK (概念验证)**

---

## 开始使用

1. 安装`Wrangler`

    ```shell
    npm install -g wrangler # 安装Wrangler
    wrangler login # 登录Wrangler
    ```

2. 下载本项目并安装依赖

    ```shell
    npm install
    ```

3. 部署到Cloudflare Worker

    ```shell
    wrangler publish
    ```

4. 使用无头客户端进行连接

    - 反向Universal WS上报地址: `wss://<你的worker地址>/ws`

## 进行开发

**API仍然处于早期阶段, 可能会随时更改!**

目前本项目自带一个简单的复读机示例, 请查看本项目的[`src/handler.ts`](./src/handler.ts)文件

由于Wrangler的WebSocket支持目前仍然有Bug, 所以只能进行线上直接调试, 不能通过`wrangler dev`本地调试

## 许可

本项目使用MIT协议进行许可

## 鸣谢

- Cloudflare: 提供了白嫖怪最爱的Worker~~和世界上最烂的CLI工具Wrangler~~
- [`botuniverse/onebot`](https://github.com/botuniverse/onebot): 提供了一个统一的机器人协议
- [`nonebot/aiocqhttp`](https://github.com/nonebot/aiocqhttp): 提供了SDK实现的参考

就这样啦, 晚安~

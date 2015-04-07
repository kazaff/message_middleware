message_middleware
==================

一个用于站内信息发送的消息中间件

---

![message](http://pic.yupoo.com/kazaff/DCsX9LmY/vdPB.jpg)

上图中大致展示了消息系统的架构布局，下面来解释一下图中的相关组件。

图中的“system server”和 “user client”代表使用消息系统的客户端方，它们代表了消息系统的数据生产者和数据消费者。

图中的中间部分是“Notifications”服务集群，每个Notifications服务为客户端提供2种服务：rest接口和socket连接。由于考虑到高负载，集群可以根据业务需求量进行水平扩展，这会使得客户端需要动态定位集群中的任意一台Node服务，目前能采纳的方案有二，其一是使用支持websocket的反向代理服务（例如Nginx），但是它会降低通信双方的稳定性，并且不利于热扩展（不重启服务的情况下动态扩展集群）。所以暂时比较青睐的方案是增加一个“Gate”服务，该服务的作用暂时归纳为如下：

❏为客户端定位Node服务器；

❏监控集群中Node服务器的状态。

　　图底部的“DB”是消息数据的持久化层，它本身可以利用MongDB的分片，复制等技术实现数据容灾和负载均衡。而“MessageDispath”组件代表的则是消息分发服务，该服务可以实现消息的跨服务器发送。
　　
    最后，我们通过一个实际场景来描述一下数据流，我们假设现在 客户端A 要发送一条消息给 客户端B （注：这里说的客户端是某个“User Client”）。要想完成这个发送任务，首先，客户端A 必须先登录，完成登录后系统会先rest请求 Gate服务，Gate服务 在验证该请求的合法性后，根据一定的算法返回集群中某一个满足条件的 Notifications服务 地址（ip+port），然后 客户端A 会向指定的 Notifications服务 发起socket请求，Notifications服务 接受并处理后完成socket连接的创建。此时 客户端A 完成了发送任务的先决条件。

　　接下来， 客户端A 会向自己获得的 Notifications服务 发送一个rest请求，包含了消息体和目标端（对应上图中的标签2），Notifications服务 接收到请求后会把消息数据存入 DB 中，然后 Notifications服务 会检查自身所拥有的socket连接池中查看是否包含目标端，如果包含，则直接将消息发送给目标端，任务完毕。
若当前接受消息的 Notifications服务 的socket连接池中没有包含消息的目标端，则它会把消息发送到 MessageDispath消息分发器中。消息系统中所有的 Notifications服务 都会注册为 MessageDispath中的一个订阅者，当 MessageDispath消息分发器一旦有数据分发，所有 Notifications服务 都会收到该消息，然后 Notifications服务 会检查自身是否包含消息的目标端，若没有包含，则直接丢弃到该消息，若包含，则直接把消息发送给目标端，这里也就是 客户端B。
这里需要注意的一点是，若发送消息的是某个系统，那么它不需要与Notifications服务保持socket连接，它只需要直接把消息发送到Gate服务的对应接口下即可，消息会被Gate服务发送给集群中的任意一台Notifications服务。

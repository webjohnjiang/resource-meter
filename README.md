# resource-meter

一个计算资源的性能评价器，用于获取计算节点的实时性能信息，做出权重weight评价

## Attention
* 访问不通或无性能信息的节点，其权重会设置为0，resource-meter默认不对其做剔除处理.
* 默认性能评价结果的权重等级为1-10级，可通过配置参数进行修改。
* resource-meter仅目前仅适用于Linux平台


## Get Started
resource-meter支持两种模式配合使用：分别是评价模式和探针模式。评价模式推荐使用编程方式调用其API，探针模式推荐直接执行命令启动探针伺服器。

> 编程方式的引入方法如下：

安装 [node](https://nodejs.org) and [npm](https://npmjs.org) 的基础上，在您的项目目录中执行：
```bash
npm install resource-meter --save
```
将resource-meter引入到您的代码中：
```js
var resourceMeter = require('resource-meter')
```

> 探针模式则直接clone本代码到您的本地，再执行相关指令即可
```bash
git clone git@github.com:cuiyongjian/resource-meter.git
cd resource-meter && npm start
```

## 评价模式
将resource-meter作为依赖可以提供`集群内节点的性能评级`的功能，基于性能评级进行特定的处理可以实现诸如`负载均衡`等特有的功能

### API
**meter(input)**

*input表示输入的资源池/节点列表*

**config(option)**

*option表示配置参数对象*
### input/输入
resource-meter支持IP地址列表形式的输入:
```js
['192.168.1.100', '192.168.1.101']
```
或者带权重的IP列表形式：
```js
[
    {value: '192.168.1.100', weight: 1},
    {value: '192.168.1.101', weight: 2}
]
```
调用meter方法即可获取结果：
```javascript
var resourceMeter = require('resource-meter');
var nodes = ['192.168.1.100', '192.168.1.101'];
var resultNodes = resourceMeter.meter(nodes);
```
resultNodes输出如下：
```
[
    {value: '192.168.1.100', weight: 1},
    {value: '192.168.1.101', weight: 2}
]
```
其中1和2是根据节点性能做出的权重评价。（默认为1-10级）

### option配置参数
通过config方法可以对resource-meter进行配置：
```
resourceMeter.config({
    disk: true,
    memery: true,
    cpu: true,
    gpu: true,
    level: '1-10',
    killzero: false,
    port: 8000
});
```
> 配置参数解释：

| 参数     | 默认值 | 类型  | 说明                                               |
|:-------:|:-----:|:-----:|--------------------------------------------------:|
| disk    | false  | bool  | 是否检测硬盘资源信息，开启后对性能有影响                |
| diskDir | '/'   | String  | 检测哪个目录，默认是根目录，推荐设置为hadoop数据目录    |
| memery  | true  | bool  | 是否检测内存资源信息                                  |
| cpu     | true  | bool  | 是否检测cpu性能信息                                  |
| gpu     | true  | bool  | 是否检测gpu资源信息                                  |
| level   | '1-10'| String| 权重判定等级范围                                     |
| killzero| false | bool  | 是否剔除宕机或无信息的节点                             |
| port    | 8000 | Number  | 性能探针的连接端口                                   |


## 探针模式
> 探针是用来探测空间、服务器运行状况和脚本信息用的，探针可以实时查看服务器硬盘资源、内存占用、网卡流量、系统负载、服务器时间等信息

可通过执行如下命令启动探针模式，探针模式可以指定一个监听端口号(默认为8000)。使用resource-meter的评价模式或其他websocket客户端可以获取该探针的信息。
```
PORT=xxx npm start
```
探针模式指定的这个端口号应该与评价模式相一致。

## 测试
resource-meter基于mocha进行单元测试，使用如下命令：
`npm test`

## TodoLista
* 子进程异步执行;
* 二次开发扩展接口


## 评价算法
实时资源负载比： A = loadAverage_Percentage*2 + cpuUsage_Percentage + memUsage_Percentage + diskUsage_Percentage

整体配置影响因子：B = (vcores*3 + totalMem(GB)\*2 + hasGPU\*2) / (32*3+32(GB)\*2+1*2)

资源性能权重评价：

> cpuUsage是指的执行探针时100毫秒时间内探测的CPU时间使用率，该参数对于表明CPU的资源利用情况具有指导意义。

>
Load Average是 CPU的Load，它所包含的信息不是CPU的使用率状况，而是在一段时间内CPU正在处理以及等待CPU处理的进程数之和的统计信息，也就是CPU使用队列的长度的统计信息。
业界一般以如下指标来判断loadAverage参数对系统的影响，故本模块将CPU一分钟内的loadAverage的负载结果[0-5]映射为[0%-100%]作为cpu负载比。
* 0.7 < load < 1: 此时是不错的状态，如果进来更多的汽车，你的马路仍然可以应付。
* load = 1: 你的马路即将拥堵，而且没有更多的资源额外的任务，赶紧看看发生了什么吧。
* load > 5: 非常严重拥堵，我们的马路非常繁忙，每辆车都无法很快的运行

参考： <http://blog.chinaunix.net/uid-687654-id-2075858.html>, <http://pclfs1983.iteye.com/blog/654927>,<http://heipark.iteye.com/blog/1340384>

由于Linux上的缺陷，Node中对Linux空闲内存存在计算不准确的问题。本模块采用了如下方案获取真实的内存使用率.(这也导致本项目仅适用于Linux平台，请谨慎使用)
>
Based on [Determining free memory on Linux](http://blog.scoutapp.com/articles/2010/10/06/determining-free-memory-on-linux), Free memory = free + buffers + cache
本实现参考自：http://stackoverflow.com/questions/20578095/node-js-get-actual-memory-usage-as-a-percent
http://blog.chinaunix.net/uid-24709751-id-3564801.html




## misc
该模块为[awesome-balancer][AB]项目的动态负载均衡策略提供了支撑。[awesome-balancer][AB]是一个包含了基于资源性能动态评价策略的负载均衡器。


## license
This software is free to use under the [MIT](http://opensource.org/licenses/MIT)  license. See the [LICENSE file][] for license text and copyright information.
[LICENSE file]: https://github.com/cuiyongjian/resource-meter/blob/master/LICENSE

Copyright © 2016 [cuiyongjian](http://blog.cuiyongjian.com) <cuiyongjian@outlook.com>

[AB]: https://github.com/cuiyongjian/awesome-balancer

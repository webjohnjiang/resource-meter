# resource-meter

一个计算资源的性能评价器，用于获取计算节点的实时性能信息，做出权重weight评价

## Attention
* 访问不通或无性能信息的节点，其权重会设置为0，resource-meter默认不对其做剔除处理，如有需要请修改默认参数或自行处置。
* 默认性能评价结果的权重等级为1-10级，可通过配置参数进行修改。
* resource-meter仅目前仅适用于Linux平台


## Get Started
resource-meter支持两种模式配合使用：分别是评价模式和探针模式。评价模式推荐使用`编程方式`调用其暴漏的meter API，探针模式推荐直接执行命令`npm run probe`启动探针伺服器。

##探针模式##
> 探针是用来探测空间、服务器运行状况和脚本信息用的，探针可以实时查看服务器硬盘资源、内存占用、网卡流量、系统负载、服务器时间等信息。

> resource-meter的评价模式底层会获取该探针返回的信息，并进行性能权重的计算。

该模式一般用来直接当做可执行程序使用。所以直接clone本代码到您的本地，再执行相关指令即可
```bash
git clone git@github.com:cuiyongjian/resource-meter.git
cd resource-meter && npm run probe
```
> probe翻译为"探针"

当然，如果您想基于本探针进行二次开发，您可以require('resource-meter').probe，我们也暴露了如下接口：

* probe.info()  调用后返回当前机器的当前信息（信息内容基于config.json配置）
* probe.start(server)  传入一个http server实例，当probe探针启动后获取到第一次机器信息时，会自动启动该server。（端口基于config.json的配置）。您可以在server中自己处理http请求。

## 评价模式
```bash
npm install resource-meter --save
```
将resource-meter引入到您的代码中：
```js
var resourceMeter = require('resource-meter')
```
将resource-meter作为依赖可以提供`集群内节点的性能评级`的功能，基于性能评级并结合您的业务，可以实现诸如`负载均衡`等特有的功能。

### 评价模式提供的API
**meter(input)**

*input表示输入的资源池/节点列表*

### input/输入
resource-meter支持IP地址列表形式的输入:
```js
['192.168.1.100', '192.168.1.101']
```
或者带权重的IP列表形式(这里传入的权重值没有任何作用，最终会被resource-meter计算后重写)：
```js
[
    {value: '192.168.1.100', weight: 1},
    {value: '192.168.1.101', weight: 2}
]
```
示例：
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

## config.json配置
通过本模块根目录下的config.json配置文件可以对resource-meter进行配置：
```
{
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
| gpu     | false  | bool  | 是否检测gpu资源信息                                  |
| level   | '1-10'| String| 权重判定等级范围                                     |
| killzero| false | bool  | 是否剔除宕机或无信息的节点                             |
| port    | 8000 | Number  | 性能探针的连接端口                                   |



## 测试
resource-meter基于mocha进行单元测试，使用如下命令：
`npm test`

## TodoList
* 子进程异步执行;
* 二次开发扩展接口


## 评价算法
实时资源负载比（0%-100%）： A = (loadAverage_Percentage*2 + cpuUsage_Percentage*1 + memUsage_Percentage + diskUsage_Percentage) / 6

实时资源负载的权重表示法（0-10）： A/10

整体配置的权重因子（0-10）：B = (vcores*3 + totalMem(GB)\*2 + hasGPU\*2) / (32*3+32(GB)\*2+1*2) * 10
*默认以“32核，32GB，有GPU”为最大配置标准*

资源性能权重评价：Weight = (A*3 + B*1)/4
*本公式更倾向于认为实时的资源负载对性能具有更大的影响，所以其与机器配置的权重比为3：1*

> cpuUsage是指的执行探针时100毫秒时间内探测的CPU时间使用率，该参数对于表明CPU的资源利用情况具有指导意义。
node中缺少cpu使用率的算法，本模块参考该文章实现：<https://gist.github.com/bag-man/5570809>
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

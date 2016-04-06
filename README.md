# resource-meter

一个计算资源的性能评价器，用于获取计算节点的实时性能信息，做出权重weight评价。其唯一评价依据就是目标节点的某一时刻的CPU/GPU/MEMERY等资源状态信息。

## Attention
* 访问不通或无性能信息的节点，其权重会设置为0，resource-meter不对其做剔除处理.
* 默认性能评价结果的权重等级为1-10级，可通过配置参数进行修改。


## Get Started
安装 [node](https://nodejs.org) and [npm](https://npmjs.org) 的基础上，在您的项目目录中执行：
```bash
npm install resource-meter --save
```
将resource-meter引入到您的代码中：
```js
var resourceMeter = require('resource-meter')
```

## Usage
resource-meter支持IP地址列表形式的输入:
```
['192.168.1.100', '192.168.1.101']
```
或者带权重的IP列表形式：
```
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

## Config
通过config方法可以对resource-meter进行配置：
```
resourceMeter.config({
    disk: true,
    memery: true,
    cpu: true,
    gpu: true,
    level: '1-10',
    killzero: false
});
```
> 配置参数解释：

| 参数     | 默认值 | 类型  | 说明                   |
|:-------:|:-----:|:-----:|----------------------:|
| disk    | true  | bool  | 是否检测硬盘资源信息      |
| memery  | true  | bool  | 是否检测内存资源信息      |
| cpu     | true  | bool  | 是否检测cpu性能信息      |
| gpu     | true  | bool  | 是否检测gpu资源信息      |
| level   | '1-10'| String| 权重判定等级范围         |
| killzero| false | bool  | 是否剔除宕机或无信息的节点 |


## 异步
子进程异步执行,working...



## 二次开发接口
working...

## 测试
`npm test`

## misc
该模块为[awesome-balancer][]项目的动态负载均衡策略提供了支撑。


## license
This software is free to use under the [MIT](http://opensource.org/licenses/MIT)  license. See the [LICENSE file][] for license text and copyright information.
[LICENSE file]: https://github.com/cuiyongjian/resource-meter/blob/master/LICENSE

Copyright © 2016 [cuiyongjian](http://blog.cuiyongjian.com) <cuiyongjian@outlook.com>

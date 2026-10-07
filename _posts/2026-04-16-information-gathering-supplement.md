---
layout: post
title: 信息收集综合利用工具
tags: [信息收集, Google Hack, Shodan, FOFA, 钟馗之眼]
---

# 信息收集综合利用工具

## 一、Google Hack（高级搜索）

使用 Google 等搜索引擎对某些特定的网络主机漏洞（通常是服务器上的脚本漏洞）进行搜索，以达到快速找到漏洞主机或特定主机漏洞的目的。

Google 毫无疑问是当今世界上最强大的搜索引擎。然而在黑客手中，它也是一个秘密武器——能搜索到一些你意想不到的信息。

> ⚠️ 注意：使用 Google 搜索引擎需要一个能够翻墙的 VPN 工具，因为 Google 是国外的服务。

Google 搜索引擎之所以强大，关键在于它详细的**搜索关键词**。更多详细教程可参考：[Google Hack 教程](http://user.qzone.qq.com/568311803/main)

### 1.1 常用搜索语法

| 语法 | 说明 | 示例 |
|:---|:---|:---|
| `inurl:` | 查找 URL 中包含该值的网页 | `inurl:mail`（可找免费邮箱） |
| `related:` | 找出和该网址类似的网站 | `related:amazon.com` |
| `intext:` | 只搜索网页正文中包含的文字（忽略标题、URL 等） | `intext:login` |
| `filetype:` | 按文件后缀/扩展名搜索含此类文件的网页 | `filetype:pdf` |
| `intitle:` | 标题中存在关键字的网页 | `intitle:后台登陆` |
| `allintitle:` | 搜索所有关键字构成标题的网页 | 不推荐使用 |
| `link:` | 返回包含指定 URL 的页面列表（只能单独使用，后跟 URL） | `link:www.baidu.com` |
| `location:` | 仅返回指定区域的相关网页（Google 新闻查询） | `queen location:canada` |
| `site:` | 限制在某个网站/域名下搜索 | `site:baidu.com` |

### 1.2 site 语法常见用法

`site:` 支持组合搜索，是实战中最常用的语法之一：

```
site:xxx.com filetype:xls          # 组合搜索：域名 + 文件类型
site:xxx.com admin                 # 搜索后台系统
site:xxx.com login
site:xxx.com 内部
site:xxx.com 系统
site:xxx.com 管理
site:xxx.com 登录
site:xxx.com 邮件
site:xxx.com email
site:xxx.com qq
site:xxx.com 群
site:xxx.com 企鹅
site:xxx.com 腾讯
```

### 1.3 常用搜索实例

```
# 搜索正文中包含"管理"的页面
intext:管理

# 查找含 mdb 类型文件的相关站点
filetype:mdb

# 查找百度域名下含 txt 文件的站点
site:baidu.com filetype:txt

# 组合搜索
site:baidu.com intext:管理
site:baidu.com inurl:login
site:baidu.com intitle:后台

# 查找使用不同语言开发的网站
site:baidu.com filetype:asp
site:baidu.com filetype:php
site:baidu.com filetype:jsp

# 查找有上传文件动作的网站（可检测文件上传漏洞）
site:baidu.com inurl:file

# 查找特定国家/地区的站点
site:tw inurl:asp?id=    # 台湾地区
site:hk inurl:asp?id=    # 香港地区
```

---

## 二、黑暗搜索引擎（网络空间搜索引擎）

| 平台名称 | 地址 |
|:---|:---|
| 奇安信鹰图 | <https://hunter.qianxin.com/> |
| 360 空间测绘 | <https://quake.360.net/quake/#/index> |
| Shodan | <https://www.shodan.io/> |
| FOFA | <https://fofa.info/> |
| 知道创宇钟馗之眼 | <https://www.zoomeye.org/> |

---

### 2.1 Shodan

> 🔗 <https://www.shodan.io/>

Shodan 是用于搜索互联网连接设备的搜索引擎，人称"黑暗引擎"。由 John C. Matherly（@achillean）于 2009 年创建。它可以让你探索互联网、发现联网设备及其位置、网络服务，监视网络安全性，进行全球性统计等。

> 💡 不需要翻墙即可使用，但需要注册登录。

#### 例一：搜索全球开放了 80 端口的网站

```
port:80
```

![Shodan 搜索结果](/assets/images/02/image.png)

**左侧面板解读：**

- **Total Results** — 搜索到的总数
- **Top Countries** — 使用最多的国家
- **Top Services** — 使用最多的服务
- **Top Organizations** — 使用最多的组织
- **Top Operating Systems** — 使用最多的操作系统
- **Top Products** — 使用最多的产品

![Shodan 详情](/assets/images/02/image-1.png)

**详细字段分析：**

| 分类 | 字段/内容 | 详细解读 | 安全意义 |
|:---|:---|:---|:---|
| **基础资产信息** | IP 地址：`45.56.71.217` | 目标服务器的公网 IP | 网络侦察的核心目标资产 |
| | 反向解析域名：`45-56-71-217.ip.linodeusercontent.com` | Linode 云服务商分配的默认二级域名 | 确认资产为云服务器，非物理机 |
| | 服务商：`Linode` | 美国知名云 VPS 服务商 | 可快速部署的云主机，常用于蜜罐搭建 |
| | 归属地：`United States, Richardson` | 美国德克萨斯州理查森市网络节点 | 海外资产，无国内业务合规风险 |
| | 标签：`cloud` / `honeypot` | 云服务器 + 蜜罐系统 | 🔴 **核心判定：该资产为诱捕攻击者的蜜罐** |
| | 站点标题：`IC商务宝典` | 伪装成正规商业内容平台 | 降低攻击者警惕性，诱骗进一步探测 |
| **HTTP 响应头信息** | `HTTP/1.1 200 OK` | 服务器正常响应 Web 请求 | 服务对外暴露，可正常访问 |
| | `Composed-By: SPIP 4.1.11 @ www.spip.net` | 底层使用 SPIP 4.1.11 开源 CMS | 该版本存在公开漏洞，用于吸引漏洞扫描攻击 |
| | `Connection: keep-alive` | 长连接配置 | 常规 Web 服务配置 |
| | `Content-Length: 159037` | 响应体大小 159037 字节 | 正常页面大小 |
| | `Content-Type: text/html;charset=utf-8` | UTF-8 编码的 HTML 页面 | 常规 Web 页面配置 |
| | `Last-Modified: Fri, 29 Jul 2022 16:53:01 GMT` | 页面最后修改时间 | 页面长期未更新，符合蜜罐静态诱饵特征 |
| | `Loginip: 224.47.119.31` | 疑似登录 IP 记录（多播地址，无实际意义） | 蜜罐刻意伪造的日志字段，误导攻击者 |
| | `P3p: CP=CAO PSA OUR` | P3P 隐私策略头 | 常规配置 |
| | `Pragma: private` | 缓存控制头，禁止缓存 | 常规配置 |
| | `Server: HP HTTP Server; HP ENVY 7640 series ...` | 伪装成惠普家用打印机的 HTTP 服务 | 🔴 **关键伪装特征**：云服务器伪装成打印机，诱骗漏洞扫描脚本 |

#### 例二：搜索全球摄像头信息

```
webcam
```

Shodan 支持组合搜索，比如搜索日本的摄像头：

```
webcam country:"JP"
```

#### Shodan 搜索技巧

| 语法 | 说明 | 示例 |
|:---|:---|:---|
| `hostname:` | 搜索指定的主机或域名 | `hostname:"google"` |
| `port:` | 搜索指定的端口或服务 | `port:"21"` |
| `country:` | 搜索指定的国家 | `country:"CN"` |
| `city:` | 搜索指定的城市 | `city:"Hefei"` |
| `org:` | 搜索指定的组织或公司 | `org:"google"` |
| `isp:` | 搜索指定的 ISP 供应商 | `isp:"China Telecom"` |
| `product:` | 搜索指定的操作系统/软件/平台 | `product:"Apache httpd"` |
| `version:` | 搜索指定的软件版本 | `version:"1.6.2"` |
| `geo:` | 搜索指定的地理位置（经纬度） | `geo:"31.8639, 117.2808"` |
| `before/after:` | 搜索指定收录时间前后的数据（格式 dd-mm-yy） | `before:"11-11-15"` |
| `net:` | 搜索指定的 IP 地址或子网 | `net:"210.45.240.0/24"` |

**组合搜索示例：**

```
# 查询中国开放了 21 端口的网站
country:"CN" port:"21"
```

---

### 2.2 FOFA

> 🔗 <https://fofa.so/>

网络空间资产检索系统（FOFA），有时也叫"佛法"，是世界上数据覆盖更完整的 IT 设备搜索引擎，由华顺信安公司开发。拥有全球联网 IT 设备更全的 DNA 信息，可用于探索全球互联网资产信息、进行资产及漏洞影响范围分析、应用分布统计、应用流行度态势感知等。号称能够把你想要的真实内容都搜索出来。

![FOFA](/assets/images/02/image-2.png)

#### 例一：通过 HTTPS 证书搜索真实 IP

**步骤 1**：访问目标网站，点击地址栏小锁图标，然后点击「证书」。

![查看证书](/assets/images/02/image-5.png)

**步骤 2**：找到证书序列号。

![证书序列号](/assets/images/02/image-4.png)

**步骤 3**：证书序列号是一串 16 进制字符，需要转换为 10 进制。访问 [进制转换工具](https://tool.lu/hexconvert)，删除冒号后进行转换。

**步骤 4**：拿到 10 进制后，在 FOFA 中使用 `cert` 语法查询：

```
cert="xxxxxxxxxx"
```

![FOFA 证书查询](/assets/images/02/image-6.png)

#### 例二：通过 ICP 备案查询真实 IP

**步骤 1**：通过站长之家 → ICP 备案实时查询 → 查询备案号

**步骤 2**：FOFA 搜索语法

```
icp="xxxx"
```

**步骤 3**：可以通过 `&&` 附加筛选条件

```
icp="xxx" && status_code="200"
```

---

### 2.3 钟馗之眼（ZoomEye）

> 🔗 <https://www.zoomeye.org/>

![钟馗之眼](/assets/images/02/image-3.png)

点击「搜索助手」，它会告诉你如何搜索想要的内容。

#### 常用搜索语法

| 语法 | 说明 |
|:---|:---|
| `app:` | 组件名（Nginx、Apache、IIS、WebLogic 等） |
| `ver:` | 组件版本 |
| `port:` | 端口 |
| `os:` | 操作系统 |
| `service:` | 服务类型 |
| `country:` | 国家 |
| `city:` | 城市 |
| `ip:` | 指定 IP |
| `site:` | 域名 |
| `title:` | 网页标题 |
| `keywords:` | 关键字 |

#### 搜索实例

```
# 搜索使用 IIS 6.0 的主机
app:"Microsoft-IIS" ver:"6.0"

# 搜索使用 WebLogic 的主机
app:"weblogic httpd" port:7001

# 查询开放 3389 端口的主机
port:3389

# 查询 Linux 系统服务器
os:linux

# 查询公网摄像头
service:"routersetup"

# 搜索美国的 Apache 服务器
app:Apache country:US

# 搜索指定 IP 信息
ip:121.42.173.26

# 查询 taobao.com 域名信息
site:taobao.com

# 搜索标题中包含关键字的网站
title:weblogic

# 关键字查询
keywords:Nginx
```

---

## 三、资产侦察系统

自动帮你收集、发现、梳理目标所有网络资产的工具，相当于安全领域的 **"侦察兵"**。

### 3.1 核心功能

| 功能模块 | 具体内容 |
|:---|:---|
| **资产发现** | 查主域名、子域名、旁站、关联域名；查 IP、IP 段、存活主机 |
| **端口与服务探测** | 扫描开放端口；识别服务版本、操作系统 |
| **Web 指纹识别** | 识别网站标题、状态码；识别 CMS、框架、中间件、后台地址 |
| **敏感信息与漏洞检测** | 查找目录泄露、备份文件、未授权访问；批量扫描常见漏洞 |
| **资产整理与监控** | 自动汇总资产清单；定时扫描、监控资产变化；导出报表、告警推送 |

### 3.2 常用工具

| 工具名称 | 地址 | 备注 |
|:---|:---|:---|
| ARL 灯塔 | <https://github.com/Aabyss-Team/ARL> | 适合 Rocky 9、CentOS 7；Kali 容易出问题 |
| Goby | <https://gobysec.net/> | 资产扫描工具 |

![资产侦察](/assets/images/02/image-7.png)

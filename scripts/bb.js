var { Query } = AV;
AV.init({
  appId: 'e1qXpMMrSwgnJ15kvtIfQKuv-MdYXbMMI', //你的 leancloud 应用 id （设置-应用keys-AppID）
  appKey: 'rk23S7pU7ryqfV9PhpBjoG5O', //你的 leancloud 应用 AppKey （设置-应用keys-AppKey）
});

//设定存储数据的 className
var query = new AV.Query('content');

var app = new Vue({
  el: '#app',
  data: {
    page: 0,
    count: 0,
    contents: [],
    translatedContent: '',
  },
  methods: {
    loadMore: function (event) {
      getData(++this.page);
    },
    translateContent(item) {
      // 如果翻译内容存在
      if (item.translatedContent) {
        // 反转 showTranslatedContent 的值
        item.showTranslatedContent = !item.showTranslatedContent;
        item.showContent = !item.showContent;
      } else {
        // 如果翻译内容不存在，调用接口进行翻译
        translateAPI(item.attributes.content)
          .then((translatedText) => {
            item.showTranslatedContent = true; // 翻译成功后设置显示标志
            item.showContent = false;
            item.translatedContent = translatedText;
          })
          .catch((error) => {
            console.error('翻译失败~', error);
          });
      }
    },
  },
});

// 检测文本中是否包含中文字符
function containsChinese(text) {
  const chineseRegex = /[\u4e00-\u9fa5]/;
  return chineseRegex.test(text);
}

// 调用翻译 API
async function translateAPI(text) {
  try {
    let sourceLang, targetLang;

    // 根据文本内容动态设置翻译的源语言和目标语言
    if (containsChinese(text)) {
      // 如果文本包含中文，则将源语言设为中文，目标语言设为英文
      sourceLang = 'ZH';
      targetLang = 'EN';
    } else {
      // 如果文本为英文，则将源语言设为英文，目标语言设为中文
      sourceLang = 'EN';
      targetLang = 'ZH';
    }

    // 发送翻译请求
    const response = await fetch('https://translation-proxy.vercel.app/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        source_lang: sourceLang,
        target_lang: targetLang,
      }),
    });

    // 检查请求是否成功
    if (!response.ok) {
      throw new Error('翻译请求失败');
    }

    // 解析并返回翻译结果
    const data = await response.json();
    return data.data;
  } catch (error) {
    // 处理异常情况
    throw error;
  }
}

// 识别 URL 链接
function urlToLink(str) {
  var re = /(http|ftp|https):\/\/[\w-]+(.[\w-]+)+([\w-.,@?^=%&:/~+#]*[\w-\@?^=%&/~+#])?/g;

  str = str.replace(re, function (website) {
    return (
      "<a href='" +
      website +
      "' target='_blank'> <i class='iconfont icon-lianjie-copy'></i>链接 </a>"
    );
  });
  return str;
}

// 识别图片链接
function urlToLink(str) {
  var re = /\bhttps?:\/\/(?!\S+(?:jpe?g|png|bmp|gif|webp|gif))\S+/g;
  var re_forpic = /\bhttps?:\/\/.*?(\.gif|\.jpeg|\.png|\.jpg|\.bmp|\.webp)/g;
  str = str.replace(re, function (website) {
    return (
      "<a href='" +
      website +
      "' target='_blank'> <i class='iconfont icon-lianjie-copy'></i>链接 </a>"
    );
  });
  str = str.replace(re_forpic, function (imgurl) {
    return "<img src='" + imgurl + "'  /> ";
  });
  return str;
}

// 获取数据
async function getData(page) {
  try {
    const results = await query
      .descending('createdAt')
      .skip(page * 20)
      .limit(20)
      .find();

    if (results.length === 0) {
      alert('已加载全部数据');
    } else {
      results.forEach((i) => {
        let dateTmp = new Date(i.createdAt);
        i.attributes.time = `${dateTmp.getFullYear()}-${
          dateTmp.getMonth() + 1 < 10 ? '0' + (dateTmp.getMonth() + 1) : dateTmp.getMonth() + 1
        }-${dateTmp.getDate() + 1 < 10 ? '0' + dateTmp.getDate() : dateTmp.getDate()} ${
          dateTmp.getHours() + 1 <= 10 ? '0' + dateTmp.getHours() : dateTmp.getHours()
        }:${dateTmp.getMinutes() + 1 <= 10 ? '0' + dateTmp.getMinutes() : dateTmp.getMinutes()}`;
        i.attributes.content = urlToLink(i.attributes.content);

        i.translatedContent = '';
        i.showTranslatedContent = false;
        i.showContent = true;

        app.contents.push(i);
      });
    }
  } catch (error) {
    console.error('获取数据失败:', error);
  }
}

getData(0);

// 计数
query.count().then(
  function (count) {
    app.count = count;
  },
  function (error) {}
);

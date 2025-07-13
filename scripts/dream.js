// Initialize LeanCloud
const { Query, init } = AV;
init({
  appId: 'e1qXpMMrSwgnJ15kvtIfQKuv-MdYXbMMI', // Your LeanCloud AppID
  appKey: 'rk23S7pU7ryqfV9PhpBjoG5O', // Your LeanCloud AppKey
});

new Vue({
  el: '#app',
  data: {
    page: 0,
    count: 0,
    contents: [],
    showNoMoreDataMessage: false,
    showToast: false,
    toastMessage: '',
  },
  methods: {
    loadMore() {
      this.page++;
      this.fetchData();
    },
    async fetchData() {
      try {
        const query = new AV.Query('dream');
        const results = await query
          .descending('createdAt')
          .skip(this.page * 20)
          .limit(20)
          .find();

        if (results.length > 0) {
          const processedResults = results.map((item) => {
            const dateTmp = new Date(item.createdAt);
            const year = dateTmp.getFullYear();
            const month = String(dateTmp.getMonth() + 1).padStart(2, '0');
            const day = String(dateTmp.getDate()).padStart(2, '0');
            const hours = String(dateTmp.getHours()).padStart(2, '0');
            const minutes = String(dateTmp.getMinutes()).padStart(2, '0');

            return {
              ...item,
              attributes: {
                ...item.attributes,
                time: `${year}-${month}-${day} ${hours}:${minutes}`,
                content: this.urlToLink(item.attributes.content),
              },
              translatedContent: '',
              showTranslatedContent: false,
              showContent: true,
              isTranslating: false,
            };
          });
          this.contents.push(...processedResults);
        } else if (this.page > 0) {
          this.showToastMessage('🫠Oops~已经到底啦~');
        }
      } catch (error) {
        console.error('获取数据失败:', error);
      }
    },
    async fetchCount() {
      try {
        const query = new AV.Query('dream');
        this.count = await query.count();
      } catch (error) {
        console.error('计数失败:', error);
      }
    },
    async translateContent(item) {
      item.isTranslating = true;

      if (item.translatedContent) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        item.showTranslatedContent = !item.showTranslatedContent;
        item.showContent = !item.showContent;
        item.isTranslating = false;
        return;
      }

      try {
        const translatedText = await this.translateAPI(item.attributes.content);
        item.translatedContent = translatedText;
        item.showTranslatedContent = true;
        item.showContent = false;
      } catch (error) {
        console.error('翻译失败~', error);
      } finally {
        item.isTranslating = false;
      }
    },
    async translateAPI(text) {
      try {
        const sourceLang = this.containsChinese(text) ? 'ZH' : 'EN';
        const targetLang = this.containsChinese(text) ? 'EN' : 'ZH';

        const response = await fetch('https://translation-proxy.vercel.app/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text,
            source_lang: sourceLang,
            target_lang: targetLang,
          }),
        });

        if (!response.ok) {
          throw new Error(`翻译请求失败: ${response.statusText}`);
        }
        const data = await response.json();
        return data.data;
      } catch (error) {
        console.error('翻译 API 调用失败:', error);
        throw error;
      }
    },
    containsChinese(text) {
      if (typeof text !== 'string') return false;
      const chineseRegex = /[\u4e00-\u9fa5]/;
      return chineseRegex.test(text);
    },
    urlToLink(str) {
      if (typeof str !== 'string') {
        return str;
      }
      const urlRegex =
        /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w-.,@?^=%&:/~+#]*[\w-@?^=%&/~+#])?/g;
      return str.replace(urlRegex, (website) => {
        return `<a href="${website}" target="_blank" rel="noopener noreferrer"> <i class="iconfont icon-lianjie-copy"></i>链接 </a>`;
      });
    },
    showToastMessage(message) {
      this.toastMessage = message;
      this.showToast = true;
      setTimeout(() => {
        this.showToast = false;
      }, 2500); // Start hiding after 2.5 seconds
      setTimeout(() => {
        this.toastMessage = '';
      }, 3000); // Clear message after 3 seconds (animation duration is 0.5s)
    },
  },
  async mounted() {
    await this.fetchData();
    await this.fetchCount();
  },
});

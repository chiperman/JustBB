// Initialize LeanCloud
const { Query, init } = AV;
init({
  appId: "e1qXpMMrSwgnJ15kvtIfQKuv-MdYXbMMI", // Your LeanCloud AppID
  appKey: "rk23S7pU7ryqfV9PhpBjoG5O", // Your LeanCloud AppKey
});

new Vue({
  el: "#app",
  data: {
    page: 0,
    count: 0,
    contents: [],
    tags: [],
    currentTag: null,
    tagsVisible: false,
  },
  computed: {
    menuIconPath() {
      return this.tagsVisible
        ? "M18 6 L6 18 M6 6 L18 18"
        : "M3 12 L21 12 M3 6 L21 6 M3 18 L21 18";
    },
  },
  methods: {
    // --- UI Interaction Methods ---
    toggleTags() {
      this.tagsVisible = !this.tagsVisible;
    },
    filterByTag(tag) {
      this.contents = [];
      this.page = 0;
      this.currentTag = tag === "All" ? null : tag;
      this.fetchData();
      this.fetchCount();
      this.tagsVisible = false; // Close tags overlay after selection
    },
    closeTags(event) {
      // Close only if the click is on the container background itself
      if (event.target.id === "tags-container") {
        this.tagsVisible = false;
      }
    },
    loadMore() {
      this.page++;
      this.fetchData();
    },

    // --- Data Fetching Methods ---
    async fetchData() {
      try {
        const query = new AV.Query("content");
        if (this.currentTag) {
          query.equalTo("tag", this.currentTag);
        }
        const results = await query
          .descending("createdAt")
          .skip(this.page * 20)
          .limit(20)
          .find();

        if (results.length > 0) {
          const processedResults = results.map((item) => {
            const dateTmp = new Date(item.createdAt);
            const year = dateTmp.getFullYear();
            const month = String(dateTmp.getMonth() + 1).padStart(2, "0");
            const day = String(dateTmp.getDate()).padStart(2, "0");
            const hours = String(dateTmp.getHours()).padStart(2, "0");
            const minutes = String(dateTmp.getMinutes()).padStart(2, "0");

            // Add processed and reactive properties
            return {
              ...item,
              attributes: {
                ...item.attributes,
                time: `${year}-${month}-${day} ${hours}:${minutes}`,
                content: this.urlToLink(item.attributes.content),
              },
              translatedContent: "",
              showTranslatedContent: false,
              showContent: true,
            };
          });
          this.contents.push(...processedResults);
        } else if (this.page > 0) {
          // Optional: Notify user that all data has been loaded
          // alert("已加载全部数据");
        }
      } catch (error) {
        console.error("获取数据失败:", error);
      }
    },
    async fetchTags() {
      try {
        const query = new AV.Query("content");
        query.select("tag");
        query.limit(1000); // Fetch up to 1000 records for tags
        const results = await query.find();
        const tags = results.map((item) => item.get("tag"));
        const uniqueTags = [...new Set(tags)].filter((tag) => tag); // Deduplicate and remove empty tags
        this.tags = ["All", ...uniqueTags];
      } catch (error) {
        console.error("获取 Tag 失败:", error);
      }
    },
    async fetchCount() {
      try {
        const query = new AV.Query("content");
        if (this.currentTag) {
          query.equalTo("tag", this.currentTag);
        }
        this.count = await query.count();
      } catch (error) {
        console.error("计数失败:", error);
      }
    },

    // --- Translation Methods ---
    async translateContent(item) {
      if (item.translatedContent) {
        item.showTranslatedContent = !item.showTranslatedContent;
        item.showContent = !item.showContent;
        return;
      }

      try {
        const translatedText = await this.translateAPI(item.attributes.content);
        item.translatedContent = translatedText;
        item.showTranslatedContent = true;
        item.showContent = false;
      } catch (error) {
        console.error("翻译失败~", error);
      }
    },
    async translateAPI(text) {
      try {
        const sourceLang = this.containsChinese(text) ? "ZH" : "EN";
        const targetLang = this.containsChinese(text) ? "EN" : "ZH";

        const response = await fetch(
          "https://translation-proxy.vercel.app/translate",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: text,
              source_lang: sourceLang,
              target_lang: targetLang,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`翻译请求失败: ${response.statusText}`);
        }
        const data = await response.json();
        return data.data;
      } catch (error) {
        console.error("翻译 API 调用失败:", error);
        throw error; // Re-throw to be caught by the caller
      }
    },

    // --- Utility Methods ---
    containsChinese(text) {
      if (typeof text !== "string") return false;
      const chineseRegex = /[\u4e00-\u9fa5]/;
      return chineseRegex.test(text);
    },
    urlToLink(str) {
      if (typeof str !== "string") {
        return str;
      }
      const urlRegex = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w-.,@?^=%&:/~+#]*[\w-@?^=%&/~+#])?/g;
      const imgRegex = /\bhttps?:\/\/.*?(\.gif|\.jpeg|\.png|\.jpg|\.bmp|\.webp)/gi;

      // First, replace image URLs with <img> tags
      let processedStr = str.replace(imgRegex, (imgUrl) => {
        return `<img src="${imgUrl}" alt="用户分享图片" />`;
      });

      // Then, replace remaining URLs with <a> tags
      processedStr = processedStr.replace(urlRegex, (website) => {
        // Avoid re-linking if it's already inside an img tag's src
        if (processedStr.includes(`src="${website}"`)) {
            return website;
        }
        return `<a href="${website}" target="_blank" rel="noopener noreferrer"> <i class="iconfont icon-lianjie-copy"></i>链接 </a>`;
      });

      return processedStr;
    },
  },
  async mounted() {
    // Initial data load
    await this.fetchTags();
    await this.fetchData();
    await this.fetchCount();

    // Set up event listener for closing the tags overlay
    const tagsContainer = document.getElementById("tags-container");
    if (tagsContainer) {
      tagsContainer.addEventListener("click", this.closeTags);
    }
  },
  beforeDestroy() {
    // Clean up event listener to prevent memory leaks
    const tagsContainer = document.getElementById("tags-container");
    if (tagsContainer) {
      tagsContainer.removeEventListener("click", this.closeTags);
    }
  },
});
<script setup>
import { ref, onMounted, computed } from "vue";
const news = ref([]);
const newsTemp = ref([]);
const options = {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "numeric",
  minute: "numeric",
  hour12: true,
};
const isSearch = ref(false);
const searchText = ref("");
const itemsPerPage = 20;
const currentPage = ref(1);

const fetchNews = async () => {
  try {
    const res = await fetch(
      `https://api.polygon.io/v2/reference/news?limit=1000&apiKey=30mHX3fZfxe_ievjRkBlJJCjv6DvmpdU`
    );
    if (res.ok) {
      const ticker = await res.json();
      return ticker.results;
    } else {
      console.log(`ERROR: Server responded with status ${res.status}`);
    }
  } catch (error) {
    console.log(`ERROR cannot read data: ${error}`);
  }
};

const searchNews = () => {
  if (searchText.value.trim() !== "") {
    isSearch.value = true;

    const filterNews = newsTemp.value.filter((item) => {
      return (
        item.insights[0].ticker.toLowerCase().includes(searchText.value.toLowerCase()) ||
        item.title.toLowerCase().includes(searchText.value.toLowerCase()) ||
        item.description.toLowerCase().includes(searchText.value.toLowerCase())
        // item.keywords.some((keyword) =>
        //   keyword.toLowerCase().includes(searchText.value.toLowerCase())
        // )
      );
    });
    news.value = filterNews;
  } else {
    isSearch.value = false;
    return
  }
  //   console.log(news.value);
};

const newsToShow = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return news.value.slice(start, end);
});

// const filterNews = async(tic) => {
//     try {
//     const res = await fetch(
//       `https://api.polygon.io/v2/reference/news?ticker=${tic}&limit=20&apiKey=30mHX3fZfxe_ievjRkBlJJCjv6DvmpdU`
//     );
//     if (res.ok) {
//       const ticker = await res.json();
//       return ticker.results;
//     } else {
//       console.log(`ERROR: Server responded with status ${res.status}`);
//     }
//   } catch (error) {
//     console.log(`ERROR cannot read data: ${error}`);
//   }
// }

// const searchNews = async(text) => {
//     news.value = await filterNews(text)
// }

onMounted(async () => {
  news.value = await fetchNews();
  newsTemp.value = news.value;
  isSearch.value = false;
  console.log(news.value);
});
</script>

<template>
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
  />
  <div class="flex items-center">
    <p class="text-3xl text-zinc-800 my-3 font-bold">NEWS</p>
    <input
      type="text"
      placeholder="Search"
      name="search"
      class="border-0 border-b-2 border-gray-300 bg-transparent placeholder-gray-300 focus:outline-none ml-auto"
      v-model="searchText"
      @keyup.enter="searchNews(searchText)"
    />
    <button type="submit" class="p-2" @click="searchNews(searchText)">
      <i class="fa fa-search"></i>
    </button>
  </div>
  <hr />

  <div v-if="news.length === 0" class="justify-center text-2xl my-10">
    <p v-if="!isSearch">Loading ...</p>
    <p v-else>No results found</p>
  </div>

  <div v-if="news.length !== 0" class="flex flex-wrap gap-20 justify-center">
    <div v-for="(res, index) in newsToShow" :key="index" class="w-full md:w-1/4 flex">
      <a
        :href="res.article_url"
        target="_blank"
        rel="noopener noreferrer"
        class="p-4 hover:bg-gray-100 rounded-lg transition my-3 flex flex-col h-full"
      >
        <!-- Content -->
        <div class="flex-grow">
          <!-- Logo -->
          <a
            :href="res.publisher.homepage_url"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              :src="res.publisher.logo_url"
              alt="News Logo"
              class="w-24 h-16 object-contain mb-3"
            />
          </a>
          <p class="text-zinc-600">Symbol: {{ res.insights[0].ticker }}</p>
          <p class="text-zinc-800 font-semibold text-xl">{{ res.title }}</p>
          <p class="text-zinc-600">{{ res.description }}</p>
        </div>

        <!-- <p class="text-sm">Keywords: {{ res.keywords }}</p> -->

        <!-- Date at Bottom -->
        <p class="text-zinc-400 mt-2 text-sm">
          {{ new Date(res.published_utc).toLocaleDateString("en-GB", options) }}
        </p>
      </a>
    </div>
  </div>
</template>

<style scoped></style>

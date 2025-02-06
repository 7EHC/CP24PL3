<script setup>
import { ref, onMounted, computed } from "vue";

const news = ref([]);
// const newsTemp = ref([]);
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
const itemsToShow = ref(15);
const showScrollTopButton = ref(false);
const isLoading = ref(false);

const fetchNews = async () => {
  isLoading.value = true;
  searchText.value = "";
  try {
    const res = await fetch(
      `https://api.polygon.io/v2/reference/news?limit=30&apiKey=30mHX3fZfxe_ievjRkBlJJCjv6DvmpdU`
    );
    if (res.ok) {
      const ticker = await res.json();
      return ticker.results;
    } else {
      console.log(`ERROR: Server responded with status ${res.status}`);
    }
  } catch (error) {
    console.log(`ERROR cannot read data: ${error}`);
  } finally {
    isLoading.value = false;
  }
};

// const searchNews = () => {
//   if (searchText.value.trim() !== "") {
//     isSearch.value = true;

//     const filterNews = newsTemp.value.filter((item) => {
//       return (
//         item.insights[0].ticker
//           .toLowerCase()
//           .includes(searchText.value.toLowerCase()) ||
//         item.title.toLowerCase().includes(searchText.value.toLowerCase()) ||
//         item.description.toLowerCase().includes(searchText.value.toLowerCase())
//         // item.keywords.some((keyword) =>
//         //   keyword.toLowerCase().includes(searchText.value.toLowerCase())
//         // )
//       );
//     });
//     news.value = filterNews;
//   } else {
//     // isSearch.value = false
//     return;
//   }
//   //   console.log(news.value);
// };

// const searchNews = async (tic) => {
//   if (searchText.value.trim() !== "") {
//     isSearch.value = true;
//     tic = searchText.value.toUpperCase();
//     news.value = await filterNews(tic);
//     isLoading.value = false
//   } else {
//     isSearch.value = false;
//     return
//   }
// };

const loadMore = () => {
  itemsToShow.value += 10;
};

const newsToShow = computed(() => {
  return news.value.slice(0, itemsToShow.value);
});

const handleScroll = () => {
  if (window.scrollY > 300) {
    showScrollTopButton.value = true;
  } else {
    showScrollTopButton.value = false;
  }
};

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

const filterNews = async (tic) => {
  try {
    const res = await fetch(
      `https://api.polygon.io/v2/reference/news?ticker=${tic}&limit=1000&apiKey=30mHX3fZfxe_ievjRkBlJJCjv6DvmpdU`
    );
    if (res.ok) {
      const ticker = await res.json();
      return ticker.results;
    } else {
      console.log(`ERROR: Server responded with status ${res.status}`);
    }
  } catch (error) {
    console.log(`ERROR cannot read data: ${error}`);
  } finally {
    isLoading.value = false;
  }
};

const searchNews = async () => {
  if (searchText.value.trim() === "") {
    isSearch.value = false;
    return;
  }

  isSearch.value = true;
  isLoading.value = true;

  const tic = searchText.value.toUpperCase();
  news.value = await filterNews(tic);
};

const refresh = async () => {
  news.value = await fetchNews();
  itemsToShow.value = 15;
  isSearch.value = false
};

onMounted(async () => {
  window.addEventListener("scroll", handleScroll);
  news.value = await fetchNews();
  // newsTemp.value = news.value;
  //   console.log(news.value);
});
</script>

<template>
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
  />
  <div>
    <div class="flex justify-center items-center">
      <p
        class="text-2xl text-yellow-400 my-3 font-bold hover:cursor-pointer mt-auto">
        NEWS
      </p>
    </div>
    <div>

    </div>
  </div>
  <div class="flex items-center">
    <p
      class="text-xl text-yellow-400 my-3 font-bold hover:cursor-pointer"
      @click="refresh()"
    >
      {{ isSearch ? "SEARCH RESULTS": "LATEST NEWS"}}
    </p>
    <input
      type="text"
      placeholder="Search"
      name="search"
      class="border-0 border-b-2 border-gray-300 bg-transparent placeholder-gray-300 focus:outline-none ml-auto w-52"
      v-model="searchText"
      @keyup.enter="searchNews(searchText)"
    />
    <button type="submit" class="p-2" @click="searchNews(searchText)">
      <i class="fa fa-search"></i>
    </button>
  </div>
  <hr />
  <!-- <p class="pt-2 text-left" v-if="isSearch"> -->
  <!-- Search Results Found: {{ news.length }} -->
  <!-- </p> -->

  <div v-if="isLoading" class="fixed inset-0 flex items-center justify-center">
    <div
      class="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"
    ></div>
  </div>
  <div
    class="flex justify-center items-center text-2xl my-10"
    v-if="news.length === 0 && !isLoading"
  >
    <div class="text-center">
      <img
        width="500"
        height="375"
        alt="Community art used to communicate no results were found."
        src="https://cdn.dribbble.com/assets/art-banners/record-7d4c55f21e5436b281a397a17863b6dc6147c9a99d3cbfbdc053ad1b1445b8db.png"
      />
      <h3 class="font-bold">No results found</h3>
      <p class="font-light text-base">
        It seems we can’t find any results based on your search.
      </p>
    </div>
  </div>

  <div
    v-if="news.length !== 0 && !isLoading"
    class="container mx-auto px-4 py-8"
  >
    <!-- Featured News Section -->
    <section class="mb-10">
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-2"
        v-if="news.length !== 0 && !isLoading"
      >
        <div
          v-for="(res, index) in newsToShow"
          :key="index"
          class="flex flex-col shadow-lg rounded-lg overflow-hidden hover:bg-gray-100 transition duration-300 ease-in-out hover:scale-105"
        >
          <a :href="res.article_url" target="_blank" rel="noopener noreferrer">
            <img
              :src="res.image_url"
              alt="News Banner"
              class="w-full h-48 object-fill"
            />
            <div class="p-4">
              <div class="flex items-center">
                <img
                  :src="res.publisher.logo_url"
                  alt="News Logo"
                  class="w-24 h-16 object-contain mb-3"
                />
                <p class="text-black text-sm ml-auto">
                  Symbol: {{ res.insights[0].ticker }}
                </p>
              </div>
              <h3 class="text-lg font-semibold text-gray-800 mb-2">
                {{ res.title }}
              </h3>
              <p class="text-gray-600 mb-2 text-sm">{{ res.description }}</p>
              <p class="text-xs text-gray-400">
                {{
                  new Date(res.published_utc).toLocaleDateString(
                    "en-GB",
                    options
                  )
                }}
              </p>
            </div>
          </a>
        </div>
      </div>
      <div
        class="flex justify-center mt-10 mb-10"
        v-if="news.length > itemsToShow && !isLoading"
      >
        <button
          @click="loadMore"
          class="bg-yellow-400 text-white font-semibold text-sm p-2 rounded-xl hover:bg-yellow-300 transition"
        >
          Load More News
        </button>
      </div>
      <div class="fixed bottom-12 right-14">
        <button
          v-show="showScrollTopButton"
          @click="scrollToTop"
          class="bg-yellow-400 text-white p-3 rounded-full shadow-lg hover:bg-yellow-300 transition"
        >
          ↑
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped></style>

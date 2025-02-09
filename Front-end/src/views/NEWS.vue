<script setup>
import { ref, onMounted, computed, onUnmounted } from "vue";

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
const sixMonthAgo = ref("");
const firstFourNews = ref();
const lastFourNews = ref();

const currentSlide = ref(0);
let interval = null;

const shuffleNews = () => {
  const shuffled = [...news.value].sort(() => 0.5 - Math.random());
  firstFourNews.value = shuffled.slice(0, 4);
  lastFourNews.value = shuffled.slice(5, 9);
};

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % firstFourNews.value.length;
};

const prevSlide = () => {
  currentSlide.value =
    (currentSlide.value - 1 + firstFourNews.value.length) %
    firstFourNews.value.length;
};

const getSixMonthAgo = () => {
  const today = new Date();
  today.setMonth(today.getMonth() - 6);
  sixMonthAgo.value = today.toISOString();
};

const fetchNews = async () => {
  isLoading.value = true;
  searchText.value = "";
  try {
    const res = await fetch(
      `https://api.polygon.io/v2/reference/news?published_utc.gte=${sixMonthAgo.value}&limit=20&apiKey=30mHX3fZfxe_ievjRkBlJJCjv6DvmpdU`
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
      `https://api.polygon.io/v2/reference/news?published_utc.gte=${sixMonthAgo.value}&ticker=${tic}&limit=20&apiKey=30mHX3fZfxe_ievjRkBlJJCjv6DvmpdU`
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
  isSearch.value = false;
};

onMounted(async () => {
  window.addEventListener("scroll", handleScroll);
  news.value = await fetchNews();

  getSixMonthAgo();
  shuffleNews();
  interval = setInterval(nextSlide, 8000);
});

onUnmounted(() => {
  clearInterval(interval);
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
        class="text-3xl text-yellow-400 my-3 font-bold hover:cursor-pointer mt-auto mb-8"
        @click="refresh"
      >
        NEWS
      </p>
    </div>
    <div class="lg:flex gap-5 mb-6" v-if="!isSearch">
      <div class="w-11/12 md:w-full">
        <div class="relative w-full overflow-hidden rounded-lg shadow-lg mb-4">
          <div
            class="flex transition-transform duration-500 ease-in-out"
            :style="{ transform: `translateX(-${currentSlide * 100}%)` }"
          >
            <div
              v-for="(item, index) in firstFourNews"
              :key="index"
              class="w-full flex-shrink-0"
            >
              <div class="relative">
                <a
                  :href="item.article_url"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    :src="item.image_url"
                    alt=""
                    class="w-full h-96 object-cover rounded-lg"
                  />
                  <div
                    class="absolute bottom-0 bg-gradient-to-t from-black to-transparent text-white p-4 w-full rounded-b-lg"
                  >
                    <p class="text-xs font-semibold text-white">
                      {{
                        new Date(item.published_utc).toLocaleDateString(
                          "en-GB",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }
                        )
                      }}
                    </p>
                    <h2
                      class="text-2xl text-white font-bold hover:text-yellow-300 transition duration-300"
                    >
                      {{ item.title }}
                    </h2>
                  </div>
                </a>
              </div>
            </div>
          </div>
          <button
            @click="prevSlide"
            class="absolute top-1/2 left-4 transform -translate-y-1/2 bg-yellow-400 text-white p-2 rounded-full shadow-md hover:bg-yellow-300 transition"
          >
            ❮
          </button>
          <button
            @click="nextSlide"
            class="absolute top-1/2 right-4 transform -translate-y-1/2 bg-yellow-400 text-white p-2 rounded-full shadow-md hover:bg-yellow-300 transition"
          >
            ❯
          </button>
        </div>
        <div class="absolute flex space-x-3 lg:w-1/2 w-3/4 justify-center">
          <div v-for="(item, index) in firstFourNews" :key="index">
            <input
              v-bind:id="'radio-' + index"
              type="radio"
              :checked="index === currentSlide"
              @change="currentSlide = index"
              class="w-2.5 h-2.5 bg-gray-300 rounded-full cursor-pointer transition-all appearance-none checked:bg-yellow-400"
            />
          </div>
        </div>
      </div>
      <div class="w-1/2 grid grid-rows-4 pb-1">
        <div
          v-for="(item, index) in lastFourNews"
          :key="index"
          class="flex border-b-2 border-gray-300"
        >
          <div class="w-full">
            <a
              :href="item.article_url"
              target="_blank"
              rel="noopener noreferrer"
              class="flex mt-2"
            >
              <img
                :src="item.image_url"
                alt=""
                class="flex w-28 h-20 object-cover rounded-lg"
              />
              <div class="w-full ml-3 flex flex-col justify-between">
                <p
                  class="text-xs font-medium text-yellow-400 hover:text-black transition pr-1"
                >
                  {{ item.insights[0].ticker }}
                </p>
                <h2
                  class="text-sm font-medium text-black hover:text-yellow-300 transition line-clamp-2 overflow-hidden text-ellipsis"
                >
                  {{ item.title }}
                </h2>
                <div class="items-end mt-auto">
                  <p class="text-xs text-black">
                    {{
                      new Date(item.published_utc).toLocaleDateString(
                        "en-GB",
                        options
                      )
                    }}
                  </p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center">
      <p
        class="text-xl text-yellow-400 my-3 font-bold hover:cursor-pointer"
        @click="refresh()"
      >
        {{ isSearch ? "SEARCH RESULTS" : "LATEST NEWS" }}
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

    <div
      v-if="isLoading"
      class="fixed inset-0 flex items-center justify-center"
    >
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
            class="flex flex-col shadow-lg rounded-lg overflow-hidden hover:bg-gray-100 transition"
          >
            <a
              :href="res.article_url"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                :src="res.image_url"
                alt="News Banner"
                class="w-full h-52 object-cover"
              />
              <div class="p-4">
                <div class="flex items-center h-12">
                  <img
                    :src="res.publisher.logo_url"
                    alt="News Logo"
                    class="w-24 h-16 object-contain mb-3"
                  />
                  <p class="text-black text-sm ml-auto">
                    Symbol: {{ res.insights[0].ticker }}
                  </p>
                </div>
                <h3 class="font-semibold text-gray-800 mb-2">
                  {{ res.title }}
                </h3>
                <p class="text-gray-600 mb-2 text-sm">{{ res.description }}</p>
              </div>
            </a>
            <p class="text-xs text-gray-400 mb-3 mt-auto pl-4">
              {{
                new Date(res.published_utc).toLocaleDateString("en-GB", options)
              }}
            </p>
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
  </div>
</template>

<style scoped></style>

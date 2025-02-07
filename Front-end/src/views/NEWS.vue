<script setup>
import { ref, onMounted, computed, onUnmounted } from "vue";

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
const itemsToShow = ref(15);
const showScrollTopButton = ref(false);
const isLoading = ref(false);
const currentIndex = ref(0);
const totalSlides = newsTemp.value.length;

const nextSlide = () => {
  currentIndex.value = (currentIndex.value + 1);
};

const prevSlide = () => {
  currentIndex.value = (currentIndex.value - 1 + totalSlides);
};

// Auto slide
// let interval;

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
      `https://api.polygon.io/v2/reference/news?ticker=${tic}&limit=50&apiKey=30mHX3fZfxe_ievjRkBlJJCjv6DvmpdU`
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
  newsTemp.value = news.value;
  // interval = setInterval(nextSlide, 3000);
});

onUnmounted(() => {
  // clearInterval(interval);
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
      @click="refresh">
        NEWS
      </p>
    </div>
    
    <div class="relative w-full max-w-4xl mx-auto" v-if="!isSearch">
    <div class="overflow-hidden relative min-h-96">
      <div
        class="absolute inset-0 flex transition-transform duration-700 ease-in-out"
        :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
      >
      <div
      v-for="(res, index) in newsTemp"
      :key="index"
      class="min-w-full flex-shrink-0 relative"
      >
      <a
              :href="res.article_url"
              target="_blank"
              rel="noopener noreferrer"
            >
          <img :src="res.image_url" class="w-full h-64 object-cover rounded-lg shadow-lg" />
          <div class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black to-transparent p-4 text-white">
            <p class="text-xs font-semibold text-white mb-3">
              {{
                new Date(res.published_utc).toLocaleDateString("en-GB", {day: "numeric", month: "long", year:"numeric"})
              }}
            </p>
            <h2 class="text-lg font-bold">{{ res.title }}</h2>
          </div>
          </a>
        </div>
      </div>
    </div>
    <button
      @click="prevSlide"
      class="absolute left-[-90px] top-1/2 transform -translate-y-1/2 p-2 bg-opacity-50 rounded-full text-white hover:bg-opacity-80"
    >
    <img src="https://cdn-icons-png.flaticon.com/512/16777/16777661.png" class="w-16 h-16">
    </button>
    <button
    @click="nextSlide"
    class="absolute right-[-90px] top-1/2 transform -translate-y-1/2 p-2 bg-opacity-50 rounded-full text-yellow-400 hover:bg-opacity-80"
    >
    <img src="https://cdn-icons-png.flaticon.com/512/7893/7893857.png" @click="nextSlide" class="w-16 h-16 hover:scale-105 transition duration-300">
    </button>
    <div class="slide flex items-center justify-center mt-5">
      <input type="radio" name="slider" id="slide1" checked>
     <input type="radio" name="slider" id="slide2">
     <input type="radio" name="slider" id="slide3">
     <input type="radio" name="slider" id="slide4">
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
            class="flex flex-col shadow-lg rounded-lg overflow-hidden hover:bg-gray-100 transition ease-in-out hover:scale-105"
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

<style scoped> 
#slider {
   margin: 0 auto;
   width: 800px;
   max-width: 100%;
   text-align: center;
}
#slider input[type=radio] {
   display: none;
}
#slider label {
   cursor:pointer;
   text-decoration: none;
}
#slides {
   padding: 10px;
   border: 3px solid #ccc;
   background: #fff;
   position: relative;
   z-index: 1;
}
#overflow {
   width: 100%;
   overflow: hidden;
}
#slide1:checked ~ #slides .inner {
   margin-left: 0;
}
#slide2:checked ~ #slides .inner {
   margin-left: -100%;
}
#slide3:checked ~ #slides .inner {
   margin-left: -200%;
}
#slide4:checked ~ #slides .inner {
   margin-left: -300%;
}
#slides .inner {
   transition: margin-left 800ms cubic-bezier(0.770, 0.000, 0.175, 1.000);
   width: 400%;
   line-height: 0;
   height: 300px;
}
#slides .slide {
   width: 25%;
   float:left;
   display: flex;
   justify-content: center;
   align-items: center;
   height: 100%;
   color: #fff;
}
#slides .slide_1 {
   background: #00171F;
}
#slides .slide_2 {
   background: #003459;
}
#slides .slide_3 {
   background: #007EA7;
}
#slides .slide_4 {
   background: #00A8E8;
}
#controls {
   margin: -180px 0 0 0;
   width: 100%;
   height: 50px;
   z-index: 3;
   position: relative;
}
#controls label {
   transition: opacity 0.2s ease-out;
   display: none;
   width: 50px;
   height: 50px;
   opacity: .4;
}
#controls label:hover {
   opacity: 1;
}
#slide1:checked ~ #controls label:nth-child(2),
#slide2:checked ~ #controls label:nth-child(3),
#slide3:checked ~ #controls label:nth-child(4),
#slide4:checked ~ #controls label:nth-child(1) {
   background: url(https://image.flaticon.com/icons/svg/130/130884.svg) no-repeat;
   float:right;
   margin: 0 -50px 0 0;
   display: block;
}
#slide1:checked ~ #controls label:nth-last-child(2),
#slide2:checked ~ #controls label:nth-last-child(3),
#slide3:checked ~ #controls label:nth-last-child(4),
#slide4:checked ~ #controls label:nth-last-child(1) {
   background: url(https://image.flaticon.com/icons/svg/130/130882.svg) no-repeat;
   float:left;
   margin: 0 0 0 -50px;
   display: block;
}
#bullets {
   margin: 150px 0 0;
   text-align: center;
}
#bullets label {
   display: inline-block;
   width: 10px;
   height: 10px;
   border-radius:100%;
   background: #ccc;
   margin: 0 10px;
}
#slide1:checked ~ #bullets label:nth-child(1),
#slide2:checked ~ #bullets label:nth-child(2),
#slide3:checked ~ #bullets label:nth-child(3),
#slide4:checked ~ #bullets label:nth-child(4) {
   background: #444;
}
@media screen and (max-width: 900px) {
   #slide1:checked ~ #controls label:nth-child(2),
   #slide2:checked ~ #controls label:nth-child(3),
   #slide3:checked ~ #controls label:nth-child(4),
   #slide4:checked ~ #controls label:nth-child(1),
   #slide1:checked ~ #controls label:nth-last-child(2),
   #slide2:checked ~ #controls label:nth-last-child(3),
   #slide3:checked ~ #controls label:nth-last-child(4),
   #slide4:checked ~ #controls label:nth-last-child(1) {
      margin: 0;
   }
   #slides {
      max-width: calc(100% - 140px);
      margin: 0 auto;
   }
}
</style>

<script setup>
import { ref,onMounted } from 'vue'
const news = ref([])
const options = { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true }

const fetchNews = async()=>{
    try {
          const res = await fetch(`https://api.polygon.io/v2/reference/news?limit=20&apiKey=30mHX3fZfxe_ievjRkBlJJCjv6DvmpdU`);
          if (res.ok) {
            const ticker = await res.json();
            return ticker.results;
          } else {
            console.log(`ERROR: Server responded with status ${res.status}`);
          }
        } catch (error) {
          console.log(`ERROR cannot read data: ${error}`);
        }
}


onMounted(async()=>{
    news.value = await fetchNews()
    // console.log(news.value.results)
})
</script>
 
<template>
<p class="text-3xl text-zinc-800 my-3 font-bold">NEWS</p>
<hr>

<div v-if="news.length === 0" class="justify-center text-2xl my-10 ">
 <p>Loading ...</p>
</div>

<div v-if="news.length !== 0" class="flex flex-wrap gap-20 justify-center">
    <div 
        v-for="(res, index) in news" 
        :key="index" 
        class="w-full md:w-1/4 flex"
    >
        <a 
            :href="res.article_url" 
            target="_blank" 
            rel="noopener noreferrer" 
            class=" p-4 hover:bg-gray-100 rounded-lg transition my-3 flex flex-col h-full"
        >
            <!-- Content -->
            <div class="flex-grow">
                <!-- Logo -->
                <a :href="res.publisher.homepage_url" target="_blank" rel="noopener noreferrer">
                    <img 
                        :src="res.publisher.logo_url" 
                        alt="News Logo" 
                        class="w-24 h-16 object-contain mb-3"
                    />
                </a>
                <p class="text-zinc-600 font-bold text-xl"  >
                    Symbol: {{ res.insights[0].ticker }}
                </p>
                <p class="text-zinc-800 font-bold text-xl">{{ res.title }}</p>
                <p class="text-zinc-600">{{ res.description }}</p>
            </div>

            <p class="text-sm">
                Keywords: {{ res.keywords }}
            </p>

            <!-- Date at Bottom -->
            <p class="text-zinc-400 mt-2">
                {{ new Date(res.published_utc).toLocaleDateString('en-GB', options) }}
            </p>
        </a>
    </div>
</div>

</template>
 
<style scoped>

</style>
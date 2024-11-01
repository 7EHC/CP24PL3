<script setup>

</script>
 
<template>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Kanit:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">

<div>
    <p class="slogan text-6xl ml-3 text-yellow-400 flex flex-col gap-3 bg-black w-1/2 p-2 md:w-2/3 sm:w-2/3">
        <span>Invest <span class="text-white">Smart</span></span>
        <span>Learn <span class="text-white">Safe</span></span>
        <span>With <span class="text-white">SIT Invest</span></span>
    </p>

    <div class="introduce flex flex-col justify-center text-center mt-16">
        <!-- <p class="text-3xl text-black">สร้างพอร์ต เทรด ออม</p> -->
    <p class="introduce p-2 text-2xl text-zinc-800 leading-10">
        <!-- ยินดีต้อนรับสู่ SIT Invest — แอปพลิเคชันที่ให้คุณสัมผัสประสบการณ์การลงทุนเสมือนจริงในตลาดหุ้นอเมริกา ไม่ว่าจะเป็นหุ้นรายตัวหรือ ETF 
        ให้คุณได้ทดสอบกลยุทธ์และสำรวจโลกการลงทุนได้อย่างปลอดภัยและง่ายดาย! ด้วยเครื่องมือที่ทันสมัยและข้อมูลที่อัปเดตแบบเรียลไทม์ คุณจะสามารถฝึกทักษะการลงทุนได้อย่างมั่นใจ -->
        Welcome to <span class="bg-black text-yellow-400 p-1">SIT Invest</span> — your gateway to a realistic investment experience in the U.S. stock market.
         With SIT Invest, you can safely explore the world of investing, test strategies, and manage a virtual portfolio featuring individual stocks and ETFs. 
         Designed for all levels, our app offers real-time data and easy-to-use tools that empower you to develop your financial acumen in a secure environment.
    </p>
    </div>
</div>
</template>
 
<style scoped>
p{
  font-family: "Kanit", sans-serif;
  font-style: normal;
}
@media (max-width: 639px) {
  .slogan {
    width: 80%;
    font-size: xx-large;
  }
  .introduce {
    font-size: small;
  }
}
</style>
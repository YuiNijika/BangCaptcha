<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { CaptchaChallenge, CaptchaVerifyRequest, CaptchaVerifyResponse, TracePoint } from '../types';

const API_BASE = 'http://localhost:3001';

const challenge = ref<CaptchaChallenge | null>(null);
const selectedIndexes = ref<number[]>([]);
const message = ref<string>('');
const isSuccess = ref<boolean>(false);
const loading = ref<boolean>(false);

// 行为分析数据
const traceData = ref<TracePoint[]>([]);
const startTime = ref<number>(0);

const fetchCaptcha = async () => {
  loading.value = true;
  message.value = '';
  isSuccess.value = false;
  selectedIndexes.value = [];
  traceData.value = []; // 重置轨迹
  
  try {
    const res = await fetch(`${API_BASE}/api/captcha`);
    if (!res.ok) throw new Error('Network response was not ok');
    const data = await res.json();
    challenge.value = data;
    startTime.value = Date.now(); // 记录开始时间
  } catch (error) {
    console.error('Failed to fetch captcha:', error);
    message.value = '加载验证码失败';
  } finally {
    loading.value = false;
  }
};

const handleMouseMove = (e: MouseEvent) => {
  // 每 50ms 记录一次，或者简单地每移动一点就记录
  // 这里为了演示简单，直接记录所有点，生产环境最好抽样
  if (!challenge.value || isSuccess.value) return;
  
  // 限制轨迹数组大小，防止内存溢出
  if (traceData.value.length > 500) return;

  traceData.value.push([Date.now(), e.clientX, e.clientY]);
};

const toggleSelect = (index: number) => {
  if (selectedIndexes.value.includes(index)) {
    selectedIndexes.value = selectedIndexes.value.filter(i => i !== index);
  } else {
    selectedIndexes.value.push(index);
  }
};

const verifyCaptcha = async () => {
  if (!challenge.value) return;
  
  loading.value = true;
  try {
    const body: CaptchaVerifyRequest = {
      id: challenge.value.id,
      selectedIndexes: selectedIndexes.value,
      traceData: traceData.value,
      startTime: startTime.value
    };

    const res = await fetch(`${API_BASE}/api/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    const data: CaptchaVerifyResponse = await res.json();
    
    if (data.success) {
      isSuccess.value = true;
      const timeSec = data.duration ? (data.duration / 1000).toFixed(2) : '0';
      message.value = `${data.message} (耗时: ${timeSec}s)`;
    } else {
      isSuccess.value = false;
      message.value = data.message;
      // 失败后延迟刷新
      setTimeout(() => {
        if (!isSuccess.value) fetchCaptcha();
      }, 1500);
    }
  } catch (error) {
    console.error('Verification failed:', error);
    message.value = '验证请求出错';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchCaptcha();
});
</script>

<template>
  <div class="captcha-container" @mousemove="handleMouseMove">
    <div v-if="loading && !challenge" class="loading">加载中...</div>
    
    <div v-else-if="challenge" class="captcha-box">
      <div class="header">
        <p>请点击所有的</p>
        <h2>{{ challenge.targetName }}</h2>
      </div>
      
      <div class="grid">
        <div 
          v-for="(img, index) in challenge.images" 
          :key="index"
          class="grid-item"
          @click="toggleSelect(index)"
        >
          <img :src="img" alt="captcha part" />
          <div v-if="selectedIndexes.includes(index)" class="overlay">
            <div class="checkmark">✓</div>
          </div>
        </div>
      </div>
      
      <div class="actions">
        <button @click="fetchCaptcha" class="refresh-btn">刷新</button>
        <button @click="verifyCaptcha" class="verify-btn" :disabled="loading">
          {{ loading ? '验证中...' : '提交' }}
        </button>
      </div>

      <div v-if="message" :class="['message', isSuccess ? 'success' : 'error']">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.captcha-container {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.captcha-box {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  padding: 16px;
  max-width: 400px;
  width: 100%;
}

.header {
  background: #4285f4;
  color: white;
  padding: 16px;
  margin: -16px -16px 16px -16px;
  border-radius: 8px 8px 0 0;
  text-align: left;
}

.header p {
  margin: 0;
  font-size: 14px;
}

.header h2 {
  margin: 4px 0 0 0;
  font-size: 24px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin-bottom: 16px;
}

.grid-item {
  position: relative;
  cursor: pointer;
  aspect-ratio: 1; /* 正方形 */
  overflow: hidden;
}

.grid-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(66, 133, 244, 0.3); /* Google Blue tint */
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid #4285f4;
  box-sizing: border-box;
}

.checkmark {
  background: #4285f4;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  position: absolute;
  top: 4px;
  left: 4px;
  font-size: 14px;
}

.actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

button {
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.2s;
}

.refresh-btn {
  background: #f1f3f4;
  color: #555;
}

.refresh-btn:hover {
  background: #e0e0e0;
}

.verify-btn {
  background: #4285f4;
  color: white;
  flex-grow: 1;
}

.verify-btn:hover {
  background: #3367d6;
}

.verify-btn:disabled {
  background: #a0c3ff;
  cursor: not-allowed;
}

.message {
  margin-top: 12px;
  padding: 8px;
  border-radius: 4px;
  text-align: center;
  font-weight: bold;
}

.success {
  background: #e6f4ea;
  color: #137333;
}

.error {
  background: #fce8e6;
  color: #c5221f;
}
</style>
<template>
  <div class="container">
    <h1>圖片分割工具</h1>
    
    <div class="upload-section">
      <div 
        class="upload-area" 
        @drop.prevent="handleFileDrop" 
        @dragover.prevent
        @click="triggerFileSelect"
      >
        <input 
          type="file" 
          ref="fileInput" 
          @change="handleFileSelect" 
          style="display: none" 
          accept="image/*"
        />
        <div v-if="!imageUrl">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          <p>拖曳圖片至此或點擊上傳</p>
        </div>
        <div v-else class="preview-container">
          <img ref="previewImage" :src="imageUrl" class="preview-image" @load="updateGridLines" />
          <!-- 切割線預覽 -->
          <div class="grid-lines" v-if="imageUrl" ref="gridLines">
            <!-- 垂直切割線 -->
            <div 
              v-for="line in columnLines" 
              :key="`col-${line.index}`" 
              class="grid-line vertical" 
              :style="{ left: `${line.position}px` }"
            ></div>
            <!-- 水平切割線 -->
            <div 
              v-for="line in rowLines" 
              :key="`row-${line.index}`" 
              class="grid-line horizontal" 
              :style="{ top: `${line.position}px` }"
            ></div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="settings" v-if="imageUrl">
      <div class="form-group">
        <label for="columns">列數 (Columns):</label>
        <input type="number" id="columns" v-model="columns" min="1" max="20" @change="updateGridLines">
      </div>
      
      <div class="form-group">
        <label for="rows">行數 (Rows):</label>
        <input type="number" id="rows" v-model="rows" min="1" max="20" @change="updateGridLines">
      </div>
      
      <button class="split-button" @click="splitImage" :disabled="isProcessing">
        {{ isProcessing ? '處理中...' : '分割圖片' }}
      </button>
    </div>
    
    <div class="status-message" v-if="statusMessage">
      {{ statusMessage }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      imageFile: null,
      imageUrl: null,
      columns: 3,
      rows: 3,
      columnLines: [],
      rowLines: [],
      isProcessing: false,
      statusMessage: ''
    }
  },
  methods: {
    triggerFileSelect() {
      this.$refs.fileInput.click();
    },
    handleFileSelect(event) {
      const file = event.target.files[0];
      if (file && file.type.startsWith('image/')) {
        this.setImageFile(file);
      }
    },
    handleFileDrop(event) {
      const file = event.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        this.setImageFile(file);
      }
    },
    setImageFile(file) {
      this.imageFile = file;
      this.imageUrl = URL.createObjectURL(file);
      this.statusMessage = '';
      // 圖片載入後會自動觸發 updateGridLines
    },
    updateGridLines() {
      if (!this.$refs.previewImage) return;
      
      // 取得圖片實際尺寸
      const imgWidth = this.$refs.previewImage.clientWidth;
      const imgHeight = this.$refs.previewImage.clientHeight;
      
      // 計算並更新垂直切割線位置
      this.columnLines = [];
      const colWidth = imgWidth / this.columns;
      for (let i = 1; i < this.columns; i++) {
        this.columnLines.push({
          index: i,
          position: colWidth * i
        });
      }
      
      // 計算並更新水平切割線位置
      this.rowLines = [];
      const rowHeight = imgHeight / this.rows;
      for (let i = 1; i < this.rows; i++) {
        this.rowLines.push({
          index: i,
          position: rowHeight * i
        });
      }
    },
    async splitImage() {
      if (!this.imageFile) return;
      
      this.isProcessing = true;
      this.statusMessage = '處理中，請稍候...';
      
      const formData = new FormData();
      formData.append('image', this.imageFile);
      formData.append('rows', this.rows);
      formData.append('cols', this.columns);
      
      try {
        // 在開發和生產環境中都使用固定的本地 API URL
        const apiUrl = 'http://localhost:5001/api/split';
        const response = await fetch(apiUrl, {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        
        // 建立下載連結
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = 'tiles.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        this.statusMessage = '分割完成！圖片已下載';
      } catch (error) {
        console.error('Error:', error);
        this.statusMessage = `處理失敗：${error.message}`;
      } finally {
        this.isProcessing = false;
      }
    }
  },
  watch: {
    // 當行或列數變更，更新切割線
    rows() {
      this.updateGridLines();
    },
    columns() {
      this.updateGridLines();
    }
  },
  mounted() {
    // 視窗大小改變時也更新切割線
    window.addEventListener('resize', this.updateGridLines);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateGridLines);
  }
}
</script>

<style>
@import './assets/styles/styles.css';
</style>

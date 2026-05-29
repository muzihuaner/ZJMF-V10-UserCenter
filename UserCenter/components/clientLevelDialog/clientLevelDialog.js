/**
 * 用户等级详情弹窗组件
 */
// 加载组件样式
(function () {
  if (!document.querySelector('link[href*="clientLevelDialog.css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `${url}components/clientLevelDialog/clientLevelDialog.css`;
    document.head.appendChild(link);
  }
})();
const clientLevelDialog = {
  template: `
    <el-dialog
      :visible.sync="visible"
      :title="lang.client_level_title"
      width="800px"
      :close-on-click-modal="true"
      custom-class="client-level-dialog"
      :append-to-body="true"
      @close="handleClose">

      <div class="level-content" v-loading="loading">
        <!-- 基本信息 -->
        <div class="info-section">
          <div class="info-row">
            <div class="info-item">
              <span class="label">{{ lang.client_level_name }}</span>
              <div class="value-box">
                <span class="level-tag" :style="{ color: levelData.background_color }">{{ levelData.level_name || '--' }}</span>
              </div>
            </div>
            <div class="info-item">
              <span class="label">{{ lang.client_level_expire_time }}</span>
              <div class="value-box">
                <span class="value">{{ formatDate(levelData.cycle_end_time) || '--' }}</span>
              </div>
            </div>
          </div>

          <div class="info-row">
            <div class="info-item">
              <span class="label">{{ lang.client_level_current_consumption }}</span>
              <div class="value-box">
                <span class="value">{{ formatMoney(levelData.cycle_consume_amount) }}</span>
              </div>
            </div>
            <div class="info-item">
              <span class="label">{{ lang.client_level_next_level_need }}</span>
              <div class="value-box">
                <span class="value">{{ formatMoney(levelData.next_level_need_amount) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 等级折扣表格 -->
        <div class="discount-section" v-if="discountTableData && discountTableData.length > 0">
          <h4 class="section-title">{{ lang.client_level_discount }}</h4>
          <el-table :data="discountTableData" border size="small" class="discount-table" 
            :header-cell-style="getHeaderCellStyle" max-height="400">
            <el-table-column prop="product_name" :label="lang.client_level_product_name" 
              min-width="150" fixed="left">
            </el-table-column>
            <el-table-column
              v-for="(col, index) in levelColumns"
              :key="index"
              :prop="col.prop"
              :label="col.label"
              min-width="100">
              <template slot-scope="scope">
                {{ scope.row[col.prop] ? scope.row[col.prop] + '%' : '--'}}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>
  `,

  data () {
    return {
      visible: false,
      loading: false,
      isFetched: false, // 是否已经获取过数据
      levelData: {
        level_name: '',
        background_color: '',
        cycle_consume_amount: '',
        cycle_end_time: '',
        next_level_need_amount: '',
        levels: [],
        discount_list: []
      },
      commonData: {},
    };
  },
  created () {
    this.commonData = JSON.parse(localStorage.getItem("common_set_before")) || {};
  },
  computed: {
    lang () {
      return window.lang;
    },
    levelColumns () {
      const columns = [];
      const levels = this.levelData.levels || [];
      levels.forEach((level, index) => {
        columns.push({
          prop: 'level_' + level.id,
          label: level.name,
          background_color: level.background_color
        });
      });
      return columns;
    },
    discountTableData () {
      // 将折扣列表转换为表格数据格式
      const levels = this.levelData.levels || [];

      // 按商品分组名称分组
      const groupMap = {};
      levels.forEach(level => {
        if (level.discount_list && level.discount_list.length > 0) {
          level.discount_list.forEach(item => {
            if (!groupMap[item.product_name]) {
              groupMap[item.product_name] = {};
            }
            groupMap[item.product_name]['level_' + level.id] = item.discount_percent;
          });
        }
      });

      // 转换为数组
      return Object.keys(groupMap).map(product_name => ({
        product_name,
        ...groupMap[product_name]
      }));
    }
  },

  methods: {
    getHeaderCellStyle ({ column }) {
      const col = this.levelColumns.find(c => c.prop === column.property)
      if (col && col.background_color) {
        return {
          color: col.background_color
        }
      }
      return {}
    },
    open () {
      return this.fetchLevelDetail();
    },

    close () {
      this.visible = false;
    },

    async fetchLevelDetail () {
      // 如果已经获取过数据，直接显示弹窗并返回 true
      // if (this.isFetched) {
      //   this.visible = true;
      //   return true;
      // }
      this.loading = true;
      try {
        // 调用接口获取等级详情
        const res = await apiClientLevelDetail();
        if (res.data.status === 200) {
          this.levelData = res.data.data || {};
          this.isFetched = true;
          if (Object.keys(this.levelData).length === 0) {
            return false;
          }
          this.visible = true;
          return true;
        }
      } catch (error) {
        this.$message.error(this.lang.client_level_fetch_error);
      } finally {
        this.loading = false;
      }
      return false;
    },

    formatMoney (value) {
      if (!value && value !== 0) return '--';
      return (this.commonData.currency_prefix || '￥') + parseFloat(value).toFixed(2) + ' ' + this.commonData.currency_suffix;
    },

    formatDate (timestamp) {
      if (!timestamp) return '--';
      const date = new Date(timestamp * 1000);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },

    handleClose () {
      // 关闭弹窗时不清空数据，以便二次打开时仍能显示
      // 数据会在下次获取新数据时自动更新
    }
  }
};

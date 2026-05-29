// 父组件执行该组件的countDown() 实现倒计时
const countDownButton = {
  template: `
        <el-button :class="myClass" :loading="loading" type="primary" :disabled="!flag">{{ flag?  name : num + lang.second_try}}</el-button>
        `,
  data() {
    return {
      num: 60,
      flag: true,
      timer: null,
    };
  },
  props: {
    myClass: {
      type: String,
      default: "count-down-btn",
    },
    name: {
      type: String,
      default: lang.send_code,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  created() { },
  methods: {
    countDown() {
      this.flag = false;
      this.num = --this.num;
      if (this.timer) {
        this.stopCountDown();
      }
      this.timer = setInterval(() => {
        if (this.num > 1) {
          this.flag = false;
          this.num = --this.num;
        } else {
          this.stopCountDown();
          this.$emit("countend");
        }
      }, 1000);
    },
    stopCountDown() {
      clearInterval(this.timer);
      this.timer = null;
      this.flag = true;
      this.num = 60;
    },
  },
  destroyed() {
    this.stopCountDown();
  },
};

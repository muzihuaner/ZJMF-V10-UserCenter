const renewDialog = {
  template: /*html*/ `
    <div>
    <el-dialog width="6.9rem" :visible.sync="isShowRenew" :show-close="false" @close="renewDgClose" class="common-renew-dialog">
    <div class="dialog-title">{{demand ? '转包年包月' : '续费'}}</div>
    <div class="dialog-main">
      <div class="renew-content">
        <div class="renew-item" :class="selected_id==item.id?'renew-active':''" v-for="item in renewList"
          :key="item.id" @click="renewItemChange(item)">
          <div class="item-top">{{item.customfield?.multi_language?.billing_cycle || item.billing_cycle}}</div>
          <div class="item-bottom" v-if="hasShowPromo && useDiscount">
            {{commonData.currency_prefix + item.base_price}}
          </div>
          <div class="item-bottom" v-else>{{commonData.currency_prefix + item.price}}</div>
          <div class="item-origin-price"
            v-if="item.price*1 < item.base_price*1 && !useDiscount">
            {{commonData.currency_prefix + item.base_price}}
          </div>
          <i class="el-icon-check check" v-show="selected_id==item.id"></i>
        </div>
      </div>
      <div class="pay-content">
        <div class="pay-price">
          <div class="money" v-loading="renewLoading">
            <span class="text">{{lang.common_cloud_label11}}:</span>
            <span>{{commonData.currency_prefix}}{{totalPrice | filterMoney}}</span>
            <el-popover placement="top-start" width="200" trigger="hover" v-if="level_discount_amount * 1 || code_discount_amount * 1">
              <div class="show-config-list">
                <p v-if="level_discount_amount*1 > 0">
                  {{lang.shoppingCar_tip_text2}}：{{commonData.currency_prefix}}
                  {{ level_discount_amount | filterMoney}}
                </p>
                <p v-if="code_discount_amount * 1 > 0">
                  {{lang.shoppingCar_tip_text4}}：{{commonData.currency_prefix}}
                  {{ code_discount_amount | filterMoney }}
                </p>
              </div>
              <i class="el-icon-warning-outline total-icon" slot="reference"></i>
            </el-popover>
            <p class="original-price"
              v-if="customfield.promo_code && totalPrice != base_price">
              {{commonData.currency_prefix}} {{ base_price | filterMoney}}
            </p>
            <p class="original-price"
              v-if="!customfield.promo_code && totalPrice != original_price">
              {{commonData.currency_prefix}} {{ original_price | filterMoney}}
            </p>
            <div class="code-box">
              <!-- 优惠码 -->
              <discount-code v-show="hasShowPromo && !customfield.promo_code"
                @get-discount="getRenewDiscount(arguments)"
                :scene="demand ? 'change_billing_cycle' : 'renew'" :product_id="product_id"
                :amount="base_price" :billing_cycle_time="duration"></discount-code>
            </div>
            <div class="code-number-text">
              <div class="discount-codeNumber" v-show="customfield.promo_code">
                {{ customfield.promo_code }}<i class="el-icon-circle-close remove-discountCode"
                  @click="removeRenewDiscountCode"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="dialog-footer">
      <el-button :loading="submitLoading" type="primary" class="btn-ok" @click="subRenew">
        {{demand ? lang.mf_demand_tip9 : lang.common_cloud_btn30}}
      </el-button>
      <div class="btn-no" @click="renewDgClose">{{lang.common_cloud_btn29}}</div>
    </div>
  </el-dialog>
  </div>
      `,

  data() {
    return {
      isShowRenew: false,
      currency_prefix: "",
      currency_suffix: "",
      commonData: {},
      submitLoading: false,
      renewList: [],
      hasClientLevel: false,
      hasShowPromo: false,
      hasShowCash: false,
      useDiscount: false,
      level_discount_amount: 0, // 用户等级优惠金额
      code_discount_amount: 0, // 优惠码优惠金额
      duration: 0, // 续费周期
      customfield: {
        promo_code: "",
        voucher_get_id: "",
      },
      billing_cycle: "",
      selected_id: 0,
      original_price: 0,
      base_price: 0,
      renewLoading: false,
    };
  },

  props: {
    demand: {
      type: Boolean,
      default: false,
    },
    id: {
      type: Number,
      default: 0,
      required: true,
    },
    product_id: {
      type: Number,
      default: 0,
      required: true,
    },
    renew_amount: {
      type: Number,
      default: 0,
    },
    billing_cycle_time: {
      type: Number,
      default: 0,
    },
    billing_cycle_name: {
      type: String,
      default: "",
    },
  },

  created() {
    // 加载css
    if (
      !document.querySelector(
        'link[href="' + url + 'components/renewDialog/renewDialog.css"]'
      )
    ) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `${url}components/renewDialog/renewDialog.css`;
      document.head.appendChild(link);
    }
    this.hasClientLevel = havePlugin("IdcsmartClientLevel");
    this.hasShowPromo = havePlugin("PromoCode");
    this.hasShowCash = havePlugin("IdcsmartVoucher");
    this.getCommon();
  },
  computed: {
    totalPrice() {
      const goodsPrice =
        this.hasShowPromo && this.customfield.promo_code
          ? this.base_price
          : this.original_price;
      const discountPrice =
        this.level_discount_amount + this.code_discount_amount;
      const totalPrice = goodsPrice - discountPrice;
      const nowPrice = totalPrice > 0 ? totalPrice.toFixed(2) : 0;
      const showPirce = Number(nowPrice);
      return showPirce > 0 ? showPirce.toFixed(2) : 0;
    },
  },

  methods: {
    // 显示续费弹窗
    showRenew() {
      if (this.isShowRenew) return;
      // 获取续费页面信息
      const params = {
        id: this.id,
      };
      this.renewLoading = true;
      this.submitLoading = true;
      this.isShowRenew = true;
      const getRenewApi = this.demand
        ? apiGetDemandToPrepaymentPrice
        : renewPage;
      getRenewApi(params)
        .then(async (res) => {
          this.submitLoading = false;
          this.renewLoading = false;
          if (res.data.status === 200) {
            this.renewList = res.data.data.host || res.data.data.duration || [];
            this.selected_id = this.renewList[0].id;
            this.billing_cycle = this.renewList[0].billing_cycle;
            this.duration = this.renewList[0].duration;
            this.original_price = this.renewList[0].price;
            this.base_price = this.renewList[0].base_price;
          }
        })
        .catch((err) => {
          this.submitLoading = false;
          this.renewLoading = false;
          this.isShowRenew = false;
          this.$message.error(err.data.msg);
        });
    },

    // 续费使用优惠码
    async getRenewDiscount(data) {
      this.customfield.promo_code = data[1];
      this.useDiscount = true;
      this.code_discount_amount = Number(data[0]);
      this.level_discount_amount = await this.getClientLevelAmount(
        this.base_price
      );
    },

    // 移除续费的优惠码
    removeRenewDiscountCode() {
      this.useDiscount = false;
      this.customfield.promo_code = "";
      this.code_discount_amount = 0;
      this.level_discount_amount = 0;
    },

    // 续费弹窗关闭
    renewDgClose() {
      this.isShowRenew = false;
      this.selected_id = 0;
      this.duration = 0;
      this.billing_cycle = "";
      this.original_price = 0;
      this.base_price = 0;
      this.renewList = [];
      this.customfield = {
        promo_code: "",
        voucher_get_id: "",
      };
      this.code_discount_amount = 0;
      this.level_discount_amount = 0;
      this.removeRenewDiscountCode();
    },

    async getClientLevelAmount(amount) {
      try {
        if (!this.hasClientLevel) {
          return 0;
        }
        const params = {id: this.product_id, amount: amount};
        const res = await apiClientLevelAmount(params);
        return Number(res.data.data.discount);
      } catch (error) {
        this.$message.error(error.data.msg);
        return 0;
      }
    },

    async getPromoDiscount(amount) {
      try {
        if (!this.hasShowPromo || !this.useDiscount) {
          return 0;
        }
        const params = {
          scene: this.demand ? "change_billing_cycle" : "renew",
          product_id: this.product_id,
          amount: amount,
          billing_cycle_time: this.duration,
          promo_code: this.customfield.promo_code,
        };

        // 更新优惠码
        const res = await applyPromoCode(params);
        return Number(res.data.data.discount);
      } catch (error) {
        this.useDiscount = false;
        this.customfield.promo_code = "";
        this.level_discount_amount = 0;
        this.$message.error(error.data.msg);
        return 0;
      }
    },

    // 续费周期点击
    async renewItemChange(item) {
      this.submitLoading = true;
      this.selected_id = item.id;
      this.duration = item.duration;
      this.billing_cycle = item.billing_cycle;
      this.original_price = item.price;
      this.base_price = item.base_price;
      // 开启了优惠码插件
      this.level_discount_amount = await this.getClientLevelAmount(
        item.base_price
      );
      this.code_discount_amount = await this.getPromoDiscount(item.base_price);
      this.submitLoading = false;
    },

    // 续费提交
    subRenew() {
      this.submitLoading = true;
      const params = {
        id: this.id,
        billing_cycle: this.billing_cycle,
        customfield: this.customfield,
        duration_id: this.selected_id,
      };
      const subApi = this.demand ? apiDemandToPrepayment : apiRenew;
      subApi(params)
        .then((res) => {
          this.submitLoading = false;
          if (res.data.status === 200) {
            if (res.data.code == "Paid") {
              this.isShowRenew = false;
              this.$message.success(res.data.msg);
              this.$emit("success");
            } else {
              this.isShowRenew = false;
              this.$emit("pay", res.data.data.id);
            }
          }
        })
        .catch((err) => {
          this.submitLoading = false;
          this.$message.error(err.data.msg);
        });
    },

    getCommon() {
      this.commonData = JSON.parse(localStorage.getItem("common_set_before"));
      this.currency_prefix = this.commonData.currency_prefix;
      this.currency_suffix = this.commonData.currency_suffix;
    },
  },
};

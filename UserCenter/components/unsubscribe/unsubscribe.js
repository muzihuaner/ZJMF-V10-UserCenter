
/* 退订（原来的申请停用） */
// 加载组件样式
(function () {
  if (!document.querySelector('link[href*="unsubscribe.css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `${url}components/unsubscribe/unsubscribe.css`;
    document.head.appendChild(link);
  }
})();
const unsubscribe = {
  template: `
    <div class="common-unsubscribe" v-if="extraCondition">
      <!-- 退订状态 -->
      <div class="refund-msg">
        <!-- 退订成功 -->
        <div class="refund-success" v-if="refundData && refundData.status == 'Suspending'">
          ({{lang.common_unsubscribe_tip_product}}{{refundData.create_time | formateTime}}{{lang.common_unsubscribe_tip_apply}}
          {{refundData.type=='Expire'?lang.common_unsubscribe_tip_expire:lang.common_unsubscribe_tip_immediate}}，{{lang.common_unsubscribe_tip_at}}<span
            v-if="refundData.type=='Expire'">{{hostData.due_time | formateTime}}</span>{{refundData.type=='Expire'? lang.common_unsubscribe_tip_after_expire:lang.common_unsubscribe_tip_pass}}
          {{lang.common_unsubscribe_tip_auto_delete}})
        </div>
        <!-- 退订失败 -->
        <div class="refund-fail" v-if="refundData && refundData.status == 'Reject'">
          ({{lang.common_unsubscribe_tip_product}}{{refundData.create_time | formateTime}}{{lang.common_unsubscribe_tip_apply}}
          {{refundData.type=='Expire'?lang.common_unsubscribe_tip_expire:lang.common_unsubscribe_tip_immediate}}
          {{lang.common_unsubscribe_tip_fail}}，
          <el-popover placement="top-start" trigger="hover">
            <span>{{refundData.reject_reason}}</span>
            <span class="reason-text" slot="reference">{{lang.common_unsubscribe_tip_view_reason}}</span> </el-popover>)
        </div>
      </div>
      <!-- 按钮区 -->
      <div class="unsubscribe-btn">
        <span class="refund-status"
          v-if="refundData && refundData.status != 'Cancelled' && refundData.status != 'Reject'">
          {{refundStatus[refundData.status]}}
        </span>
        <!-- 取消退订 -->
        <span class="refund-stop-btn"
          v-if="refundData && (refundData.status=='Pending' || refundData.status=='Suspend' || refundData.status=='Suspending')"
          @click="quitRefund">
          {{lang.common_unsubscribe_btn_cancel}}
        </span>
        <!-- 申请退订 -->
        <span class="refund-btn" @click="openRefundDialog"
          v-if="showApplyBtn">
          {{lang.common_unsubscribe_title}}
        </span>
      </div>
      <!-- 申请退订弹窗 -->
      <div class="refund-dialog refundDialog">
        <el-dialog width="6.8rem" :visible.sync="isShowRefund" :show-close="false" @close="refundDgClose" :append-to-body="appendToBody" :custom-class="dialogCustomClass">
          <div class="dialog-title">
            {{lang.common_unsubscribe_title}}
          </div>
          <div class="dialog-main">
            <div class="label">{{lang.common_unsubscribe_label_product_info}}</div>
            <div class="host-content">
              <div class="host-item">
                <div class="left">{{lang.common_unsubscribe_label_order_time}}:</div>
                <div class="right">{{refundPageData.host.create_time | formateTime}}</div>
              </div>
              <div class="host-item" v-if="refundPageData.allow_refund == 1">
                <div class="left">{{lang.common_unsubscribe_label_order_amount}}:</div>
                <div class="right">{{commonData.currency_prefix + refundPageData.host.first_payment_amount}}</div>
              </div>
            </div>
            <div class="label">{{lang.common_unsubscribe_label_reason}}</div>
            <el-select v-if="refundPageData.reason_custom == 0" v-model="refundParams.suspend_reason" multiple>
              <el-option v-for="item in refundPageData.reasons" :key="item.id" :value="item.id"
                :label="item.content">
              </el-option>
            </el-select>
            <el-input v-else v-model="refundParams.suspend_reason"></el-input>
            <template v-if="!isDemandFee">
              <div class="label">{{lang.common_unsubscribe_label_time}}</div>
              <el-select v-model="refundParams.type">
                <el-option value="Immediate" :label="lang.common_unsubscribe_label_immediate"></el-option>
              </el-select>
              <div class="label" v-if="refundPageData.allow_refund == 1">{{lang.common_unsubscribe_label_refund_amount}}</div>
              <div class="amount-content" v-if="refundPageData.allow_refund == 1">
                {{commonData.currency_prefix}}{{refundPageData.host.amount}}
              </div>
            </template>
          </div>
          <div class="demand-stop-tip" v-if="isDemandFee">
            <span>{{lang.common_unsubscribe_demand_tip_note}}：</span><br>
            <span>{{lang.common_unsubscribe_demand_tip_delete}}</span><br>
            <span>{{lang.common_unsubscribe_demand_tip_backup}}</span>
          </div>
          <div class="dialog-footer">
            <span class="refund-tip" v-show="refundPageData.allow_refund === 0 && !isDemandFee">
              {{lang.common_unsubscribe_tip_no_refund}}
            </span>
            <el-button class="btn-ok" @click="subRefund" :loading="submitLoading">
              {{refundPageData.allow_refund == 1 ? lang.common_unsubscribe_btn_confirm_refund: lang.common_unsubscribe_btn_confirm_unsubscribe}}
            </el-button>
            <div class="btn-no" @click="isShowRefund = false">{{lang.account_btn3}}</div>
          </div>
        </el-dialog>
      </div>
      

    <!-- 安全验证 -->
    <security-verification ref="securityRef" @confirm="hadelSecurityConfirm" action-type="host_refund" :append-to-body="appendToBody">
    </security-verification>
    </div>
    `,
  filters: {
    formateTime(time) {
      if (time && time !== 0) {
        return formateDate(time * 1000);
      } else {
        return "--";
      }
    },
  },
  components: {
    securityVerification
  },
  data() {
    return {
      isShowRefund: false,
      submitLoading: false,
      refundPageData: {
        host: {
          create_time: 0,
          first_payment_amount: 0,
        },
      },
      refundParams: {
        suspend_reason: [],
        type: 'Immediate',
      },
      refundStatus: {
        Pending: lang.common_unsubscribe_pending,
        Suspending: lang.common_unsubscribe_suspending,
        Suspend: lang.common_unsubscribe_suspend,
        Suspended: lang.common_unsubscribe_suspended,
        Refund: lang.common_unsubscribe_refund,
        Reject: lang.common_unsubscribe_reject,
        Cancelled: lang.common_unsubscribe_cancelled,
      },
      commonData: {},
      security_verify_method: '',
      security_verify_value: '',
      certify_id: '',
    };
  },
  props: {
    id: {
      type: Number | String,
      required: true,
    },
    hostData: {
      type: Object,
      default: () => ({})
    },
    extraCondition: { // 额外显示条件
      type: Boolean,
      default: true
    },
    isDemandFee: { // 是否按需计费
      type: Boolean,
      default: false
    },
    refundData: {
      type: Object,
      default: () => ({})
    },
    appendToBody: { // 是否将弹窗挂载到 body
      type: Boolean,
      default: false
    },

  },
  computed: {
    showApplyBtn() {
      // change_billing_cycle_id 不存在 且 没有退款信息 或者 退款单状态为 已拒绝 或 已取消
      const { change_billing_cycle_id } = this.hostData;
      const status = this.refundData?.status;
      return !change_billing_cycle_id && !this.refundData || ['Reject', 'Cancelled'].includes(status)
    },
    dialogCustomClass() {
      return this.appendToBody ? 'unsubscribe-dialog' : ''
    }
  },
  created() {
    this.commonData = JSON.parse(localStorage.getItem("common_set_before"));
  },
  methods: {
    hadelSecurityConfirm(callbackFun, securityForm) {
      this.security_verify_method = securityForm.security_verify_method;
      this.security_verify_value = securityForm.security_verify_value;
      this.certify_id = securityForm.certify_id;
      this[callbackFun]();
    },
    // 退订弹窗提交
    subRefund() {
      const params = {
        host_id: this.id,
        suspend_reason: this.refundParams.suspend_reason,
        type: this.refundParams.type,
        security_verify_method: this.security_verify_method,
        security_verify_value: this.security_verify_value,
        certify_id: this.certify_id,

      };
      if (!params.suspend_reason || (this.refundPageData.reason_custom === 0 && params.suspend_reason.length === 0)) {
        this.$message.error(lang.common_unsubscribe_msg_select_reason);
        return false;
      }
      if (!params.type) {
        this.$message.error(lang.common_unsubscribe_msg_select_time);
        return false;
      }
      this.submitLoading = true;
      refund(params)
        .then((res) => {
          if (res.data.status == 200) {
            this.$message.success(res.data.msg);
            this.isShowRefund = false;
            this.$emit("refresh-refund-msg");
          }
        })
        .catch((err) => {
          this.security_verify_method = "";
          this.security_verify_value = "";
          this.certify_id = "";
          this.$message.error(err.data.msg);
          if (
            err?.data?.data?.need_security_verify === true &&
            err?.data?.data?.available_methods?.length > 0
          ) {
            this.$refs.securityRef.openDialog(
              "subRefund",
              err.data.data.available_methods
            );
          }
        }).finally(() => {
          this.submitLoading = false;
        });
    },
    // 取消退订
    quitRefund() {
      const params = {
        id: this.refundData.id,
      };
      cancelRefund(params)
        .then((res) => {
          if (res.data.status == 200) {
            this.$message.success(res.data.msg);
            this.$emit("refresh-refund-msg");
          }
        })
        .catch((err) => {
          this.$message.error(err.data.msg);
        });
    },
    // 打开退订弹窗
    async openRefundDialog() {
      try {
        this.security_verify_method = "";
        this.security_verify_value = "";
        this.certify_id = "";
        const params = {
          host_id: this.id,
        };
        // 获取退订页面信息
        const res = await refundPage(params);
        if (res.data.status == 200) {
          this.refundPageData = res.data.data;
          if (res.data.data.reason_custom == 0) {
            this.refundParams.suspend_reason = [];
          } else {
            this.refundParams.suspend_reason = "";
          }
          this.isShowRefund = true;
        }
        if (this.isDemandFee) {
          this.refundParams.type = "Immediate";
        }
      } catch (error) {
        this.$message.error(error.data.msg);
      }
    },
    // 关闭退订弹窗
    refundDgClose() {
      this.isShowRefund = false;
      this.refundParams.suspend_reason = [];
      this.refundParams.type = "Immediate";
    },
  }
};

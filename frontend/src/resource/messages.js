const messages = {
    messages: {
        // global 컨펌 메시지
        'global_confirm_save_001': '저장하시겠습니까?',
        'global_confirm_modify_001': '수정하시겠습니까?',
        'global_confirm_delete_001': '삭제하시겠습니까?',

        // 사용자 컨펌 메시지
        'user_confirm_withdrawal_001': '탈퇴하시겠습니까?',
        'user_confirm_sign_out_001': '로그아웃하시겠습니까?',

        // 사용자 얼럿 메시지
        "user_alert_restrict_001": '접근이 제한되어 있습니다.',
    },
    removeMessage: function(key) {
      if (this.messages[key]) {
          delete this.messages[key];
          return true;
      } else {
          return false;
      }
    },
    addMessage: function(key, message) {
        if (this.messages[key]) {
            return false;
        } else {
            this.messages[key] = message;
            return true;
        }
    },
    getMessage: function(key) {
        const message = this.messages[key];

        if (message) {
            return message;
        }

        return '';
    }
}

export default messages;
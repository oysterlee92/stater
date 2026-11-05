// 인덱스 화면에서 팝업 열기와 닫기 동작을 확인합니다.
const popup = oyster.popupView('example-popup');

document.querySelector('#open-example-popup').addEventListener('click', () => {
    popup.show();
});

document.querySelector('#close-example-popup').addEventListener('click', () => {
    popup.hide();
});


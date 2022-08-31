const container = document.querySelector('#container');
const signInButton = document.querySelector('#signIn');
const signUpButton = document.querySelector('#signUp');


signInButton.addEventListener('click',() => container.classList.remove('right-panel-active'))

function send_se_code1() {
    $("#send_code10").click(function () {       
        var $this = $(this);
        //alert("test1");
        var email = $("#emailAddress").val();
        //alert(email);
        $.ajax({
            url:"/sendEmail",
            type:"post",
            data:{"email":email},
            success:function (messages) {
                alert(messages);
                var countDown = 10;
                //settime($this, countDown);
                $this.off("click");
                var countDown = 10;
                var timer = setInterval(function(){
                    if(countDown > 0) {
                        $this.text(countDown+"秒后重新获取");
                    
                    } else {
                        $this.text("获取验证码"); 
                        send_se_code1();                               
                        clearInterval(timer);
                    }
                    countDown--   
                },1000);
            },
            error:function () {
                alert("Fail!");
            }
        })
    });
}

$(function () {
    send_se_code1();
});
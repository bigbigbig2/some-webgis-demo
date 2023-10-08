package com.example.idmoserver.entity.vo.request;

import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.hibernate.validator.constraints.Length;

/*
* 封装重置密码时提交的数据数据结构对象
* email: 用户的电子邮件地址，用于确定是哪个用户正在尝试重置密码。
* code: 用户从电子邮件中收到的验证码。
* */
@Data
@AllArgsConstructor
public class ConfirmResetVO {
    //验证邮箱格式
    @Email
    String email;
    @Length(max = 6, min = 6)
    String code;
}

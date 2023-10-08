package com.example.idmoserver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.idmoserver.entity.dto.Account;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AccountMapper extends BaseMapper<Account> {
}

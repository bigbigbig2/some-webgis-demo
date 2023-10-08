package com.example.idmoserver.entity.dto;

import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.v3.oas.models.security.SecurityScheme;
import lombok.Data;

@Data
@TableName("fixed3857")
public class Fixed {
    Integer gid;
    Integer avg_d_kbps;
    Integer avg_u_kbps;
    Integer avg_lat_ms;

}

package com.example.idmoserver.controller;

import com.example.idmoserver.mapper.HexagonMapper;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api/hexagons")
@Tag(name = "动态矢量切片服务", description = "动态生成六边形格网")
public class HexagonController {

    @Autowired
    private HexagonMapper hexagonMapper;

    @GetMapping("/{z}/{x}/{y}")
    public ResponseEntity getHexagons(@PathVariable Integer z,
                                              @PathVariable Integer x,
                                              @PathVariable Integer y) {
        Object mvt = hexagonMapper.findHexagonsByZXY(z, x, y);

//        if (mvt == null  ) {
//            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
//        }
        return ResponseEntity.ok()
                .header("Content-Type", "application/x-protobuf")
                .body(mvt);
    }
}
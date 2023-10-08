package com.example.idmoserver.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;


@Mapper
public interface HexagonMapper{

    @Select("SELECT fixed_hexagons(#{z},#{x},#{y},6)")
    Object findHexagonsByZXY(Integer z, Integer x, Integer y);
}

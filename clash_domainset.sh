#!/bin/bash

if [ "$#" -ne 3 ]; then
    echo "用法: $0 <输入目录> <输出目录> <文件扩展名>"
    echo "示例: $0 input_folder output_folder txt"
    exit 1
fi

input_dir="$1"
output_dir="$2"
extension="$3"

if [ ! -d "$input_dir" ]; then
    echo "错误: 输入目录 '$input_dir' 不存在"
    exit 1
fi

mkdir -p "$output_dir"

find "$input_dir" -maxdepth 1 -type f -name "*.$extension" | while read -r file; do
    filename=$(basename "$file")
    # 清空输出文件（如果存在）
    : > "$output_dir/$filename"
    while IFS= read -r line || [ -n "$line" ]; do
        if [[ $line =~ ^\..*$ ]]; then
            echo "+$line" >> "$output_dir/$filename"
        else
            echo "$line" >> "$output_dir/$filename"
        fi
    done < "$file"
done

echo "处理完成。文件已保存到 $output_dir 目录。"
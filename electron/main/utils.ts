/**
 * 简单的IP和端口编码/解码工具
 * 规则：
 * 1. IP中的数字(0-9)映射到字母(a-j)
 * 2. 冒号(:)映射到'x'
 * 3. 每组数字间用'-'分隔
 */

// 数字到字母的映射
const NUM_TO_LETTER: { [key: string]: string } = {
  "0": "a",
  "1": "b",
  "2": "c",
  "3": "d",
  "4": "e",
  "5": "f",
  "6": "g",
  "7": "h",
  "8": "i",
  "9": "j",
};

// 字母到数字的映射
const LETTER_TO_NUM: { [key: string]: string } = Object.fromEntries(
  Object.entries(NUM_TO_LETTER).map(([num, letter]) => [letter, num])
);

/**
 * 生成传输口令
 * 示例: "192.168.1.1:8080" -> "bjc-bgi-b-b-x-iaie"
 */
export function generateCode(ip: string, port: number): string {
  const ipStr = ip.replace(/\./g, "-");
  const portStr = port.toString();
  const fullAddr = `${ipStr}:${portStr}`;

  return fullAddr
    .split("")
    .map((char) => {
      if (char === ":") return "x";
      if (char === "-") return "-";
      return NUM_TO_LETTER[char] || char;
    })
    .join("");
}

/**
 * 解析传输口令
 * 示例: "bjc-bgi-b-b-x-iaie" -> { ip: "192.168.1.1", port: 8080 }
 */
export function parseCode(code: string): { ip: string; port: number } | null {
  try {
    const parts = code.split("x");
    if (parts.length !== 2) return null;

    const [ipPart, portPart] = parts;

    // 解析IP
    const ip = ipPart
      .split("-")
      .map((segment) =>
        segment
          .split("")
          .map((letter) => LETTER_TO_NUM[letter] || letter)
          .join("")
      )
      .join(".");

    // 解析端口
    const port = parseInt(
      portPart
        .split("")
        .map((letter) => LETTER_TO_NUM[letter] || letter)
        .join("")
    );

    return { ip, port };
  } catch (error) {
    console.error("Invalid code format:", error);
    return null;
  }
}

/**
 * 验证口令格式是否正确
 */
export function isValidCode(code: string): boolean {
  const pattern = /^[a-j-]+x[a-j]+$/;
  return pattern.test(code);
}

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

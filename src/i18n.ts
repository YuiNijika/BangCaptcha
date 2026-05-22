export type Lang = 'zh' | 'en' | 'jp';

const translations: Record<Lang, Record<string, string>> = {
  zh: {
    // 角色
    'bd-kasumi': '户山香澄',
    'bd-arisa': '市谷有咲',
    'bocchi-nijika': '伊地知虹夏',
    'gbc-nina': '井芹仁菜',
    'gbc-mmk': '河原木桃香',
    'gbc-486': '安和昴',
    'gbc-rupa': 'Rupa',
    'gbc-tomo': '海老塚智',
    'kon-yui': '平泽唯',
    'kon-azusa': '中野梓',
    'ave-saki': '丰川祥子',
    'ave-nyamu': '喵姆',
    'ave-mutsumi': '若叶睦',
    'mygo-tomori': '高松灯',
    'mygo-anon': '千早爱音',
    'mygo-soyo': '长崎素世',
    'mygo-rana': '要乐奈',

    // 格式化
    'band_characters': '{band} 的角色',
    
    // 验证信息
    'verify_success': '阿里嘎多~验证通过!',
    'verify_failed': '验证失败',
    'verify_expired': '验证码已过期',
    'verify_too_fast': '验证过快',
    'verify_timeout': '验证超时',
    'verify_invalid_trace': '无效的轨迹数据',
    'verify_suspicious_trace': '可疑的轨迹数据',
    'verify_invalid_format': '无效的数据格式',
    'verify_incorrect_count': '选择数量错误',
    'verify_incorrect_selection': '选择错误',
    'too_many_requests': '请求过多，请稍后再试。',
    'too_many_attempts': '验证尝试次数过多，请稍候。'
  },
  en: {
    // Characters
    'bd-kasumi': 'Kasumi Toyama',
    'bd-arisa': 'Arisa Ichigaya',
    'bocchi-nijika': 'Nijika Ijichi',
    'gbc-nina': 'Nina Iseri',
    'gbc-mmk': 'Momoka Kawaragi',
    'gbc-486': 'Subaru Awa',
    'gbc-rupa': 'Rupa',
    'gbc-tomo': 'Tomo Ebizuka',
    'kon-yui': 'Yui Hirasawa',
    'kon-azusa': 'Azusa Nakano',
    'ave-saki': 'Sakiko Togawa',
    'ave-nyamu': 'Nyamu',
    'ave-mutsumi': 'Mutsumi Wakaba',
    'mygo-tomori': 'Tomori Takamatsu',
    'mygo-anon': 'Anon Chihaya',
    'mygo-soyo': 'Soyo Nagasaki',
    'mygo-rana': 'Rana Kaname',

    // Formatting
    'band_characters': 'Characters from {band}',

    // Verification messages
    'verify_success': 'Arigato~ Verification passed!',
    'verify_failed': 'Verification failed',
    'verify_expired': 'Challenge expired',
    'verify_too_fast': 'Too fast',
    'verify_timeout': 'Timeout',
    'verify_invalid_trace': 'Invalid trace data',
    'verify_suspicious_trace': 'Suspicious trace data',
    'verify_invalid_format': 'Invalid format',
    'verify_incorrect_count': 'Incorrect count',
    'verify_incorrect_selection': 'Incorrect selection',
    'too_many_requests': 'Too many requests, please try again later.',
    'too_many_attempts': 'Too many verification attempts, please wait.'
  },
  jp: {
    // キャラクター
    'bd-kasumi': '戸山香澄',
    'bd-arisa': '市ヶ谷有咲',
    'bocchi-nijika': '伊地知虹夏',
    'gbc-nina': '井芹仁菜',
    'gbc-mmk': '河原木桃香',
    'gbc-486': '安和すばる',
    'gbc-rupa': 'ルパ',
    'gbc-tomo': '海老塚智',
    'kon-yui': '平沢唯',
    'kon-azusa': '中野梓',
    'ave-saki': '豊川祥子',
    'ave-nyamu': 'にゃむ',
    'ave-mutsumi': '若葉睦',
    'mygo-tomori': '高松燈',
    'mygo-anon': '千早愛音',
    'mygo-soyo': '長崎そよ',
    'mygo-rana': '要楽奈',

    // フォーマット
    'band_characters': '{band} のキャラクター',

    // 認証メッセージ
    'verify_success': 'ありがとう〜認証成功！',
    'verify_failed': '認証失敗',
    'verify_expired': '期限切れ',
    'verify_too_fast': '早すぎます',
    'verify_timeout': 'タイムアウト',
    'verify_invalid_trace': '無効な軌跡データ',
    'verify_suspicious_trace': '不審な軌跡データ',
    'verify_invalid_format': '無効な形式',
    'verify_incorrect_count': '選択数が間違っています',
    'verify_incorrect_selection': '選択が間違っています',
    'too_many_requests': 'リクエストが多すぎます。後でもう一度お試しください。',
    'too_many_attempts': '認証試行回数が多すぎます。お待ちください。'
  }
};

export function t(key: string, lang: Lang | string = 'zh', params?: Record<string, string>): string {
  const selectedLang = (translations[lang as Lang] ? lang : 'zh') as Lang;
  let text = translations[selectedLang][key] || key;
  
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, v);
    }
  }
  
  return text;
}

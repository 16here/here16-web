/**
 * 省市区数据（演示用精简版）。
 *
 * 说明：
 * - 覆盖全部 34 个省级行政区，每个省精选代表性地级市与区/县；
 * - 仅供地址表单三级联动演示使用，如需完整数据可替换为
 *   「china-area-data」等 npm 包或后端接口下发；
 * - 结构：AREAS = [{ name: 省, cities: [{ name: 市, districts: [区,...] }] }]
 */
export const AREAS = [
  { name: '北京市', cities: [{ name: '北京市', districts: ['东城区', '西城区', '朝阳区', '海淀区', '丰台区', '通州区'] }] },
  { name: '天津市', cities: [{ name: '天津市', districts: ['和平区', '河西区', '南开区', '滨海新区', '武清区'] }] },
  { name: '上海市', cities: [{ name: '上海市', districts: ['黄浦区', '徐汇区', '静安区', '浦东新区', '闵行区'] }] },
  { name: '重庆市', cities: [{ name: '重庆市', districts: ['渝中区', '江北区', '南岸区', '渝北区', '沙坪坝区'] }] },
  {
    name: '河北省',
    cities: [
      { name: '石家庄市', districts: ['长安区', '桥西区', '新华区', '裕华区'] },
      { name: '唐山市', districts: ['路南区', '路北区', '丰润区', '丰南区'] },
      { name: '保定市', districts: ['竞秀区', '莲池区', '徐水区'] }
    ]
  },
  {
    name: '山西省',
    cities: [
      { name: '太原市', districts: ['小店区', '迎泽区', '杏花岭区', '万柏林区'] },
      { name: '大同市', districts: ['平城区', '云冈区', '新荣区'] },
      { name: '运城市', districts: ['盐湖区', '永济市', '河津市'] }
    ]
  },
  {
    name: '辽宁省',
    cities: [
      { name: '沈阳市', districts: ['和平区', '沈河区', '大东区', '浑南区'] },
      { name: '大连市', districts: ['中山区', '西岗区', '沙河口区', '甘井子区'] },
      { name: '鞍山市', districts: ['铁东区', '铁西区', '立山区'] }
    ]
  },
  {
    name: '吉林省',
    cities: [
      { name: '长春市', districts: ['南关区', '宽城区', '朝阳区', '二道区'] },
      { name: '吉林市', districts: ['昌邑区', '龙潭区', '船营区'] }
    ]
  },
  {
    name: '黑龙江省',
    cities: [
      { name: '哈尔滨市', districts: ['道里区', '南岗区', '道外区', '香坊区'] },
      { name: '齐齐哈尔市', districts: ['龙沙区', '建华区', '铁锋区'] }
    ]
  },
  {
    name: '江苏省',
    cities: [
      { name: '南京市', districts: ['玄武区', '秦淮区', '鼓楼区', '江宁区'] },
      { name: '苏州市', districts: ['姑苏区', '虎丘区', '吴中区', '工业园区'] },
      { name: '无锡市', districts: ['梁溪区', '锡山区', '惠山区'] },
      { name: '徐州市', districts: ['云龙区', '鼓楼区', '泉山区'] }
    ]
  },
  {
    name: '浙江省',
    cities: [
      { name: '杭州市', districts: ['上城区', '拱墅区', '西湖区', '滨江区'] },
      { name: '宁波市', districts: ['海曙区', '江北区', '鄞州区'] },
      { name: '温州市', districts: ['鹿城区', '龙湾区', '瓯海区'] }
    ]
  },
  {
    name: '安徽省',
    cities: [
      { name: '合肥市', districts: ['瑶海区', '庐阳区', '蜀山区', '包河区'] },
      { name: '芜湖市', districts: ['镜湖区', '弋江区', '鸠江区'] },
      { name: '马鞍山市', districts: ['花山区', '雨山区', '博望区'] },
      { name: '蚌埠市', districts: ['龙子湖区', '蚌山区', '禹会区'] }
    ]
  },
  {
    name: '福建省',
    cities: [
      { name: '福州市', districts: ['鼓楼区', '台江区', '仓山区', '晋安区'] },
      { name: '厦门市', districts: ['思明区', '湖里区', '集美区'] },
      { name: '泉州市', districts: ['鲤城区', '丰泽区', '洛江区'] }
    ]
  },
  {
    name: '江西省',
    cities: [
      { name: '南昌市', districts: ['东湖区', '西湖区', '青云谱区'] },
      { name: '九江市', districts: ['濂溪区', '浔阳区'] },
      { name: '赣州市', districts: ['章贡区', '南康区'] }
    ]
  },
  {
    name: '山东省',
    cities: [
      { name: '济南市', districts: ['历下区', '市中区', '槐荫区', '历城区'] },
      { name: '青岛市', districts: ['市南区', '市北区', '崂山区', '黄岛区'] },
      { name: '烟台市', districts: ['芝罘区', '莱山区', '福山区'] }
    ]
  },
  {
    name: '河南省',
    cities: [
      { name: '郑州市', districts: ['中原区', '二七区', '金水区', '惠济区'] },
      { name: '洛阳市', districts: ['老城区', '西工区', '涧西区'] },
      { name: '开封市', districts: ['龙亭区', '顺河回族区', '鼓楼区'] }
    ]
  },
  {
    name: '湖北省',
    cities: [
      { name: '武汉市', districts: ['江岸区', '江汉区', '武昌区', '洪山区'] },
      { name: '宜昌市', districts: ['西陵区', '伍家岗区'] },
      { name: '襄阳市', districts: ['襄城区', '樊城区'] }
    ]
  },
  {
    name: '湖南省',
    cities: [
      { name: '长沙市', districts: ['芙蓉区', '天心区', '岳麓区', '开福区'] },
      { name: '株洲市', districts: ['荷塘区', '芦淞区', '天元区'] },
      { name: '衡阳市', districts: ['珠晖区', '雁峰区', '石鼓区'] }
    ]
  },
  {
    name: '广东省',
    cities: [
      { name: '广州市', districts: ['越秀区', '海珠区', '天河区', '白云区'] },
      { name: '深圳市', districts: ['罗湖区', '福田区', '南山区', '宝安区'] },
      { name: '东莞市', districts: ['南城街道', '东城街道', '松山湖'] },
      { name: '佛山市', districts: ['禅城区', '南海区', '顺德区'] }
    ]
  },
  {
    name: '海南省',
    cities: [
      { name: '海口市', districts: ['秀英区', '龙华区', '琼山区', '美兰区'] },
      { name: '三亚市', districts: ['海棠区', '吉阳区', '天涯区', '崖州区'] }
    ]
  },
  {
    name: '四川省',
    cities: [
      { name: '成都市', districts: ['锦江区', '青羊区', '武侯区', '成华区'] },
      { name: '绵阳市', districts: ['涪城区', '游仙区'] },
      { name: '宜宾市', districts: ['翠屏区', '南溪区'] }
    ]
  },
  {
    name: '贵州省',
    cities: [
      { name: '贵阳市', districts: ['南明区', '云岩区', '花溪区', '观山湖区'] },
      { name: '遵义市', districts: ['红花岗区', '汇川区'] }
    ]
  },
  {
    name: '云南省',
    cities: [
      { name: '昆明市', districts: ['五华区', '盘龙区', '官渡区', '西山区'] },
      { name: '大理州', districts: ['大理市', '祥云县'] }
    ]
  },
  {
    name: '陕西省',
    cities: [
      { name: '西安市', districts: ['新城区', '碑林区', '雁塔区', '未央区'] },
      { name: '宝鸡市', districts: ['渭滨区', '金台区'] },
      { name: '咸阳市', districts: ['秦都区', '渭城区'] }
    ]
  },
  {
    name: '甘肃省',
    cities: [
      { name: '兰州市', districts: ['城关区', '七里河区', '西固区'] },
      { name: '天水市', districts: ['秦州区', '麦积区'] }
    ]
  },
  {
    name: '青海省',
    cities: [
      { name: '西宁市', districts: ['城东区', '城中区', '城西区'] },
      { name: '海东市', districts: ['乐都区', '平安区'] }
    ]
  },
  { name: '台湾省', cities: [{ name: '台北市', districts: ['中正区', '大同区', '信义区', '大安区'] }] },
  {
    name: '内蒙古自治区',
    cities: [
      { name: '呼和浩特市', districts: ['新城区', '回民区', '玉泉区'] },
      { name: '包头市', districts: ['东河区', '昆都仑区', '青山区'] }
    ]
  },
  {
    name: '广西壮族自治区',
    cities: [
      { name: '南宁市', districts: ['兴宁区', '青秀区', '江南区'] },
      { name: '桂林市', districts: ['秀峰区', '叠彩区', '七星区'] }
    ]
  },
  {
    name: '西藏自治区',
    cities: [
      { name: '拉萨市', districts: ['城关区', '堆龙德庆区'] },
      { name: '日喀则市', districts: ['桑珠孜区'] }
    ]
  },
  {
    name: '宁夏回族自治区',
    cities: [
      { name: '银川市', districts: ['兴庆区', '西夏区', '金凤区'] },
      { name: '吴忠市', districts: ['利通区'] }
    ]
  },
  {
    name: '新疆维吾尔自治区',
    cities: [
      { name: '乌鲁木齐市', districts: ['天山区', '沙依巴克区', '新市区'] },
      { name: '喀什地区', districts: ['喀什市', '疏附县'] }
    ]
  },
  {
    name: '香港特别行政区',
    cities: [{ name: '香港', districts: ['中西区', '湾仔区', '东区', '九龙城区'] }]
  },
  {
    name: '澳门特别行政区',
    cities: [{ name: '澳门', districts: ['花地玛堂区', '大堂区', '氹仔'] }]
  }
]

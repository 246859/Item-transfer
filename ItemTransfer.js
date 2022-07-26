const BASE_DIR = "./plugins/ItemTransfer/";
const CONFIG_PATH = BASE_DIR + "Config.json";
const DATA_PATH = BASE_DIR + "Data.json";
const LANG_PATH = BASE_DIR + "Lang.json";

const DEFAULT_CONFIG = {
    //是否开启背包与箱子间的物品转移
    pack2boxTransfer: true,
    //是否开启箱子与箱子间的物品转移
    box2boxTransfer: true,
    //背包到箱子转移时忽略主物品栏
    p2bStartIndex:9
};

const DEFAULT_LANG = {
    FORM: {
        MAIN_TITLE: "§l物品转移",
        PACK_2_BOX: {
            NAME: "§l背包转移",
            IMG: "textures/blocks/beehive_front.png",
            ORDER: 0,
            MENU: {
                P2B: {
                    NAME: "§l背包->箱子",
                    TIP: "§l是否将背包物品转移至此箱子中"
                },
                B2P: {
                    NAME: "§l箱子->背包",
                    TIP: "§l是否将此箱子物品转移到背包中"
                },

            }
        },
        BOX_2_BOX: {
            NAME: "§l箱子转移",
            IMG: "textures/blocks/chest_front.png",
            ORDER: 1,
            MENU: {
                NAME: "§l箱子A->箱子B",
                TIP: "§l是否将箱子A的物品转移到箱子B中",
            }
        },
        GIVE_UP: {
            NAME: "§l放弃转移",
            IMG: "textures/ui/book_trash_default.png",
            ORDER: 2
        },
        CONFIRM: "§l确认",
        CANCEL: "§l取消"
    },
    INFO: {
        PACK_2_BOX: {
            NAME: "背包<-->箱子",
            START: "手持木剑潜行点击一个§4要转移的箱子§f,或/tf giveup退出",
        },
        BOX_2_BOX: {
            NAMEA: "§4箱子A§f-->箱子B",
            NAMEB: "箱子A-->§a箱子B",
            BOXA: "手持木剑潜行点击§4待转移的箱子A§f,或/tf giveup退出",
            BOXB: "手持木剑潜行点击§a要转移的箱子B§f,或/tf giveup退出",
        }
    },
    ERROR: {
        IO: {
            READ: "json文件读取出错||Error reading json file:",
            WRITE: "json文件保存出错||Error writing json file:",
            INIT: "file init error:",
        },
        TRANSFER: {
            REPEAT: "§4当前你已处于其他转移状态，请放弃转移后再选择!",
            SNEAKING: "§4请在潜行状态下选择!",
            REPEATBOX: "§4请勿选择同一个箱子!",
            CT_ERROR: "§4容器构造异常",
            POS_ERROR: "§4位置参数解析错误",
            BLOCK_ERROR: "§4方块解析异常",
            BL_CT_ERROR: "§4容器解析异常",
            ENDER_CHEST: {
                KEY: "ender_chest",
                VALUE: "§4不支持以末影箱为目标的物品转移!"
            },
            SHUILKER_BOX: {
                KEY: "shulker_box",
            },
            NON_CT: "§4非容器方块!",
            UNABLE:"功能未开启",
        }
    }
}

const DEFAULT_CMD = {
    ROOT: {
        CMD: "transfer",
        DESCRIPTION: "物品转移/Item transfer",
        PERMISSION: PermType.Any,
        FLAG: 0x80,
        ALIAS: "tf"
    },
    TRANSFER_ACTION: {
        NAME: "transfer_action",
        VALUES: ["p2b", "b2b"]
    },
    BASE_ACTION: {
        NAME: "base_action",
        VALUES: ["giveup"]
    },
    GUI_ACTION: {
        NAME: "gui_action",
        VALUES: ["gui"]
    },
    KIT_ACTION:{
        NAME:"kit_action",
        VALUES:["kit"]
    },
    ROOT_ACTION: {
        NAME: "do",
        TYPE: ParamType.Enum,
        EnumOption: 1
    }
}


const DEFAULT_DATA = [];
const DELAY_TIME = 2 << 15;
const TAG = {
    P2B: "P2B",
    B2BA: "B2BA",
    B2BB: "B2BB",
}
const FACTOR = "FACTOR";
const TRIGGER = "wooden_sword";
const TRIGGER_FLAG = "ITEM_TRANSFER_TOOL";

//运行时 玩家map
let plMap = new Map();
//存储Bloc对象的map
let p2bMap = new Map();
let b2bMap = new Map();

let config = {};
let LANG = {};

/**
 * 工具操作封装
 */
class Utils {

    static stringfy(data) {
        return data ? JSON.stringify(data) : null;
    }

    static debug(data) {
        mc.broadcast('§4debug:' + data);
    }

    static tell(pl, msg, type) {
        pl.tell(`§l[ITEM_TRANSFER] : ${msg}`, type);
    }

    static isNUll(param) {
        return param === null || param === undefined;
    }



    static getTriggerItem(){
      let item = mc.newItem("wooden_sword",1);
      item.setLore([TRIGGER_FLAG]);
      return item;
    }

    static isTriggerItem(item){
        let nbt = item.getNbt();
        let tagNbt = nbt.getData("tag");
        if (!tagNbt) return;
        let displayNbt = tagNbt.getData("display");
        if (!displayNbt)return;
        let loreNbt = displayNbt.getData("Lore");
        if (!loreNbt) return;
        return loreNbt.getTag(0).toString() === TRIGGER_FLAG;
    }


    static isSamePos(block1, block2) {

        let pos1 = block1.pos;
        let pos2 = block2.pos;

        // Utils.debug(pos1.x)
        // Utils.debug(pos2.x)
        // Utils.debug(pos1.y)
        // Utils.debug(pos2.y)
        // Utils.debug(pos1.z)
        // Utils.debug(pos2.z)
        // Utils.debug(pos2.dimid)
        // Utils.debug(pos1.dimid)

        return pos1.x === pos2.x && pos1.y === pos2.y && pos1.z === pos2.z && pos1.dimid === pos2.dimid;
    }

    static hasNull(...params) {
        try {
            params.forEach(param => {
                if (this.isNUll(param))
                    throw new Error();
            });
        } catch (e) {
            return true;
        }
        return false;
    }

    //读取一个json文件
    static readFile(path) {
        try {
            let buffer = File.readFrom(path);
            return buffer ? JSON.parse(buffer) : null;
        } catch (err) {
            logger.error(LANG.ERROR.IO.READ + err.toString());
        }
    }

    //写入一个json文件
    static writeFile(path, data) {
        try {
            File.writeTo(path, Utils.stringfy(data));
        } catch (err) {
            logger.error(LANG.ERROR.IO.WRITE + err.toString());
        }
    }

    //解决pc端点击物品多次触发回调问题
    static resolveWin10Problem(pl) {
        pl.addTag(FACTOR);
        setTimeout(() => {
            pl.removeTag(FACTOR);
        }, 200);
    }

    //检验唯一状态tag
    static isOnlyStatusTag(pl, tag) {

        if (Utils.hasNull(pl, tag)) return;

        let hasTag = pl.hasTag(tag);

        if (!hasTag) return false;

        Object.keys(TAG).forEach(key => {
            if (TAG[key] !== tag)
                hasTag = hasTag && pl.hasTag(TAG[key]);
        });

        return !hasTag;
    }

    //校验是否为一个空白的状态，若点击了其他的按钮但又未退出则为非空白状态
    static isCleanStatus(pl) {
        return !(pl.hasTag(TAG.P2B) || pl.hasTag(TAG.B2BA) || pl.hasTag(TAG.B2BB));
    }

    //初始化配置文件
    static initFile() {
        try {
            //插件目录
            if (!File.exists(BASE_DIR))
                File.mkdir(BASE_DIR);
            //config文件
            if (!File.exists(CONFIG_PATH))
                Utils.writeFile(CONFIG_PATH, DEFAULT_CONFIG);
            //lang文件
            if (!File.exists(LANG_PATH))
                Utils.writeFile(LANG_PATH, DEFAULT_LANG);
            //data文件
            if (!File.exists(DATA_PATH))
                Utils.writeFile(DATA_PATH, DEFAULT_DATA);
        } catch (err) {
            logger.error(LANG.ERROR.IO.INIT + err.toString());
        }
    }

    //初始化插件运行时数据
    static initData() {

        let configBuffer;
        let langBuffer;

        if ((configBuffer = Utils.readFile(CONFIG_PATH)))
            config = configBuffer;

        if ((langBuffer = Utils.readFile(LANG_PATH)))
            LANG = langBuffer;
    }

    //注册指令
    static registerCommand() {
        //顶层命令注册
        let cmd = mc.newCommand(
            DEFAULT_CMD.ROOT.CMD,
            DEFAULT_CMD.ROOT.DESCRIPTION,
            DEFAULT_CMD.ROOT.PERMISSION,
            DEFAULT_CMD.ROOT.FLAG,
            DEFAULT_CMD.ROOT.ALIAS);

        //枚举设置
        cmd.setEnum(
            DEFAULT_CMD.TRANSFER_ACTION.NAME,
            DEFAULT_CMD.TRANSFER_ACTION.VALUES);
        cmd.setEnum(
            DEFAULT_CMD.BASE_ACTION.NAME,
            DEFAULT_CMD.BASE_ACTION.VALUES);
        cmd.setEnum(
            DEFAULT_CMD.GUI_ACTION.NAME,
            DEFAULT_CMD.GUI_ACTION.VALUES);
        cmd.setEnum(
            DEFAULT_CMD.KIT_ACTION.NAME,
            DEFAULT_CMD.KIT_ACTION.VALUES);

        //参数注册
        cmd.mandatory(
            DEFAULT_CMD.ROOT_ACTION.NAME,
            DEFAULT_CMD.ROOT_ACTION.TYPE,
            DEFAULT_CMD.TRANSFER_ACTION.NAME,
            DEFAULT_CMD.ROOT_ACTION.EnumOption);
        cmd.mandatory(
            DEFAULT_CMD.ROOT_ACTION.NAME,
            DEFAULT_CMD.ROOT_ACTION.TYPE,
            DEFAULT_CMD.BASE_ACTION.NAME,
            DEFAULT_CMD.ROOT_ACTION.EnumOption);
        cmd.mandatory(
            DEFAULT_CMD.ROOT_ACTION.NAME,
            DEFAULT_CMD.ROOT_ACTION.TYPE,
            DEFAULT_CMD.GUI_ACTION.NAME,
            DEFAULT_CMD.ROOT_ACTION.EnumOption);
        cmd.mandatory(
            DEFAULT_CMD.ROOT_ACTION.NAME,
            DEFAULT_CMD.ROOT_ACTION.TYPE,
            DEFAULT_CMD.KIT_ACTION.NAME,
            DEFAULT_CMD.ROOT_ACTION.EnumOption);

        //参数重载
        cmd.overload([DEFAULT_CMD.TRANSFER_ACTION.NAME]);
        cmd.overload([DEFAULT_CMD.BASE_ACTION.NAME]);
        cmd.overload([DEFAULT_CMD.GUI_ACTION.NAME]);
        cmd.overload([DEFAULT_CMD.KIT_ACTION.NAME]);

        //回调设置
        cmd.setCallback(Core.cmdCallBack);

        //安装
        cmd.setup();

    }

}

class CMD {

    static titleToPlayer(pl, title, info) {
        //title展示
        mc.runcmdEx(`title ${pl.name} subtitle ${info}`);
        mc.runcmdEx(`title ${pl.name} title ${title}`);
    }

    static initTitleStatus(pl) {
        //设置title滞留时间
        mc.runcmdEx(`title ${pl.name} times 1 ${DELAY_TIME} 1`);
    }

    static closeTitleStatus(pl) {
        //title重置
        mc.runcmdEx(`title ${pl.name} reset`);
        //title清空
        mc.runcmdEx(`title ${pl.name} clear`);
    }

}

/**
 * 核心数据处理类
 */
class Core {

    //初始化玩家状态
    static initPlayerStatus(pl, tag) {

        if (Utils.hasNull(pl, tag)) return;
        //增加一个tag
        pl.addTag(tag);
        //加入map
        plMap.set(pl.name, pl);
    }

    static cleanPlayerStatus(pl) {

        if (Utils.hasNull(pl)) return;

        pl.removeTag(TAG.P2B);
        pl.removeTag(TAG.B2BA);
        pl.removeTag(TAG.B2BB);
        pl.removeTag(FACTOR);

        plMap.delete(pl.name);
        p2bMap.delete(pl.name);
        b2bMap.delete(pl.name);
    }

    //背包转移回调
    static p2bCallBack(pl) {

        if (Utils.isNUll(pl)) return;

        if (!config.pack2boxTransfer) {
            Utils.tell(pl,LANG.ERROR.TRANSFER.UNABLE);
            return;
        }

        //状态是否清空
        if (!Utils.isCleanStatus(pl)) {
            Utils.tell(pl, LANG.ERROR.TRANSFER.REPEAT);
            return;
        }

        //初始化玩家数据状态
        this.initPlayerStatus(pl, TAG.P2B);
        //初始化标题状态
        CMD.initTitleStatus(pl);
        //展示title
        CMD.titleToPlayer(pl, LANG.INFO.PACK_2_BOX.NAME, LANG.INFO.PACK_2_BOX.START);

    }

    //箱子转移回调
    static b2baCallBack(pl) {

        if (Utils.isNUll(pl)) return;

        if (!config.box2boxTransfer){
            Utils.tell(pl,LANG.ERROR.TRANSFER.UNABLE);
            return;
        }

        //状态是否清空
        if (!Utils.isCleanStatus(pl)) {
            Utils.tell(pl, LANG.ERROR.TRANSFER.REPEAT);
            return;
        }

        //初始化玩家数据状态
        this.initPlayerStatus(pl, TAG.B2BA);
        //初始化标题状态
        CMD.initTitleStatus(pl);
        //展示标题
        CMD.titleToPlayer(pl, LANG.INFO.BOX_2_BOX.NAMEA, LANG.INFO.BOX_2_BOX.BOXA);

    }

    //放弃转移回调
    static giveUpCallBack(pl) {
        CMD.closeTitleStatus(pl);
        Core.cleanPlayerStatus(pl);
    }

    //指令回调
    static cmdCallBack(cmd, origin, output, results) {
        //参数非空校验
        if (Utils.hasNull(cmd, origin, output, results)) return;

        let pl = origin.player;

        if (Utils.isNUll(pl)) return;

        switch (results[DEFAULT_CMD.ROOT_ACTION.NAME]) {
            //p2b
            case DEFAULT_CMD.TRANSFER_ACTION.VALUES[0] : {
                Core.p2bCallBack(pl);
            }
                break;
            //b2b
            case DEFAULT_CMD.TRANSFER_ACTION.VALUES[1] : {
                Core.b2baCallBack(pl);
            }
                break;
            //giveup
            case DEFAULT_CMD.BASE_ACTION.VALUES[0] : {
                Core.giveUpCallBack(pl);
            }
                break;
            // gui
            case DEFAULT_CMD.GUI_ACTION.VALUES[0] : {
                pl.sendForm(Form.mainForm(), Form.mainFormCallBack);
            }break;
            // kit
            case DEFAULT_CMD.KIT_ACTION.VALUES[0] : {
                pl.giveItem(Utils.getTriggerItem());
                pl.refreshItems();
            }
        }
    }

    static p2bTriggerProcess(pl, block) {
        //记录下方块对象
        p2bMap.set(pl.name, block);
        pl.sendForm(Form.p2bMenuForm(), Form.p2bMenuFormCallBack);
    }

    static b2bATriggerProcess(pl, block) {
        //记录下blockA对象
        b2bMap.set(pl.name, {boxA: block});
        //更新title
        CMD.titleToPlayer(pl, LANG.INFO.BOX_2_BOX.NAMEB, LANG.INFO.BOX_2_BOX.BOXB);
        //标记进入b2bB的状态
        pl.removeTag(TAG.B2BA);
        pl.addTag(TAG.B2BB);
    }

    static b2bBTriggerProcess(pl, block) {
        //记录下blockB的对象
        if (Utils.isSamePos(b2bMap.get(pl.name).boxA, block)) {
            Utils.tell(pl, LANG.ERROR.TRANSFER.REPEATBOX);
            return;
        }

        b2bMap.get(pl.name).boxB = block;
        pl.sendModalForm(
            LANG.FORM.BOX_2_BOX.MENU.NAME,
            LANG.FORM.BOX_2_BOX.MENU.TIP,
            LANG.FORM.CONFIRM,
            LANG.FORM.CANCEL,
            (player, result) => {
                if (result) {
                    //创建转移处理器
                    let b2bProcessor = new Transfer(
                        player,
                        Transfer.transformBlockToCt(pl, b2bMap.get(pl.name).boxA),
                        Transfer.transformBlockToCt(pl, b2bMap.get(pl.name).boxB));
                    b2bProcessor.doB2bTransfer(pl);
                    Core.cleanPlayerStatus(pl);
                    Core.b2baCallBack(pl);
                }
            }
        );
    }

    static triggerCallback(pl, item, block, side, pos) {

        //参数校验
        if (Utils.hasNull(pl, item, block, side, pos) || pl.hasTag(FACTOR)) return;

        //win10多次触发解决
        Utils.resolveWin10Problem(pl);

        //潜行状态
        if (!pl.sneaking) return;

        //木剑且含有对于的lore
        if (item.type.indexOf(TRIGGER) < 0 || !Utils.isTriggerItem(item)) return;

        //非容器方块
        if (!block.hasContainer()) {
            Utils.tell(pl, LANG.ERROR.TRANSFER.NON_CT);
            return;
        }

        if (Utils.isOnlyStatusTag(pl, TAG.P2B)) {
            Core.p2bTriggerProcess(pl, block);
        } else if (Utils.isOnlyStatusTag(pl, TAG.B2BA)) {
            Core.b2bATriggerProcess(pl, block);
        } else if (Utils.isOnlyStatusTag(pl, TAG.B2BB)) {
            Core.b2bBTriggerProcess(pl, block);
        }

    }
}

class Transfer {

    constructor(pl, ct1, ct2) {

        if (Utils.hasNull(ct1, ct2)) {
            Utils.tell(pl, LANG.ERROR.TRANSFER.CT_ERROR);
            return;
        }

        this.containerA = ct1;
        this.containerB = ct2;

    }

    //将坐标对象转换成容器对象
    static transformBlockToCt(pl, block) {

        if (Utils.hasNull(pl, block)) {
            Utils.tell(pl, LANG.ERROR.TRANSFER.BLOCK_ERROR);
            return;
        }

        let ct = block.getContainer();

        if (Utils.hasNull(ct)) {
            Utils.tell(pl, LANG.ERROR.TRANSFER.BL_CT_ERROR);
        }

        return ct;
    }

    doP2bTransfer(pl, start) {
        let target = p2bMap.get(pl.name);
        this.processor(pl, start, target);
    }

    doB2bTransfer(pl) {
        let target = b2bMap.get(pl.name).boxB;
        this.processor(pl, 0, target);
    }

    processor(pl, start, target) {

        let ct1 = this.containerA;
        let ct2 = this.containerB;

        if (Utils.hasNull(pl, start, target)) {
            Utils.tell(pl, LANG.ERROR.TRANSFER.BL_CT_ERROR);
            return;
        }

        //末影箱子不支持
        if (target.type.indexOf(LANG.ERROR.TRANSFER.ENDER_CHEST.KEY) > -1) {
            Utils.tell(pl, LANG.ERROR.TRANSFER.ENDER_CHEST.VALUE);
            return;
        }

        for (let i = start; i < ct1.size; i++) {
            //获取当前方格的物品
            let item = ct1.getItem(i);

            //非空判断
            if (item.isNull()) continue;

            //小木剑跳过
            if (Utils.isTriggerItem(item)) continue;

            //物品和目标同为潜影盒时跳过
            if (item.type.indexOf(LANG.ERROR.TRANSFER.SHUILKER_BOX.KEY) > -1
                && target.type.indexOf(LANG.ERROR.TRANSFER.SHUILKER_BOX.KEY) > -1) continue;

            //获取nbt
            let nbt = item.getNbt();

            //根据nbt生成新物品
            let newItem = mc.newItem(nbt);

            //放入另一个容器中
            if (!ct2.addItem(newItem)) break;

            //删除原物品
            if (!item.setNull()) {
                //原物品删除失败话则删除目标容器的物品
                ct2.removeItem(i, 64);
                break;
            }

            //刷新玩家容器
            if (!pl.refreshItems()) break;
        }

        //最终刷新
        pl.refreshItems();
    }
}

/**
 * 表单封装
 */
class Form {
    //主菜单
    static mainForm() {
        let fm = mc.newSimpleForm();
        fm.setTitle(LANG.FORM.MAIN_TITLE);
        fm.addButton(LANG.FORM.PACK_2_BOX.NAME, LANG.FORM.PACK_2_BOX.IMG);
        fm.addButton(LANG.FORM.BOX_2_BOX.NAME, LANG.FORM.BOX_2_BOX.IMG);
        fm.addButton(LANG.FORM.GIVE_UP.NAME, LANG.FORM.GIVE_UP.IMG);
        return fm;
    }

    //主菜单回调
    static mainFormCallBack(pl, id) {

        if (Utils.hasNull(pl, id)) return;

        // Utils.debug(id);

        switch (id) {
            case LANG.FORM.PACK_2_BOX.ORDER: {
                Core.p2bCallBack(pl);
            }
                break;
            case LANG.FORM.BOX_2_BOX.ORDER: {
                Core.b2baCallBack(pl);
            }
                break;
            case LANG.FORM.GIVE_UP.ORDER: {
                Core.giveUpCallBack(pl);
            }
                break;
        }
    }

    static p2bMenuForm() {
        let fm = mc.newSimpleForm();
        fm.setTitle(LANG.FORM.PACK_2_BOX.NAME);
        fm.addButton(LANG.FORM.PACK_2_BOX.MENU.P2B.NAME);
        fm.addButton(LANG.FORM.PACK_2_BOX.MENU.B2P.NAME);
        return fm;
    }

    static p2bMenuFormCallBack(pl, id) {
        if (Utils.hasNull(pl, id)) return;

        switch (id) {
            //p2b
            case 0 : {
                pl.sendModalForm(
                    LANG.FORM.PACK_2_BOX.MENU.P2B.NAME,
                    LANG.FORM.PACK_2_BOX.MENU.P2B.TIP,
                    LANG.FORM.CONFIRM,
                    LANG.FORM.CANCEL,
                    (player, result) => {
                        //TODO 点击确认则进行物品转移
                        if (result) {
                            new Transfer(
                                pl,
                                pl.getInventory(),
                                Transfer.transformBlockToCt(pl, p2bMap.get(pl.name))
                            ).doP2bTransfer(pl, config.p2bStartIndex);
                        }
                    });
            }
                break;
            //b2p
            case 1 : {
                pl.sendModalForm(
                    LANG.FORM.PACK_2_BOX.MENU.B2P.NAME,
                    LANG.FORM.PACK_2_BOX.MENU.B2P.TIP,
                    LANG.FORM.CONFIRM,
                    LANG.FORM.CANCEL,
                    (player, result) => {
                        //TODO 点击确认则进行物品转移
                        if (result) {
                            new Transfer(pl, Transfer.transformBlockToCt(pl, p2bMap.get(pl.name)),
                                pl.getInventory()).doP2bTransfer(pl, 0);
                        }
                    });
            }
        }
    }
}


function init() {
    //初始化配置文件
    Utils.initFile();
    //初始化运行时数据
    Utils.initData();
    //注册指令
    Utils.registerCommand();
}


init();

mc.listen("onUseItemOn", Core.triggerCallback);
mc.listen("onLeft", Core.giveUpCallBack);

logger.info("ItemTransfer init successfully!");
logger.info("Author:stranger");
logger.info("Version:v1.0.1");

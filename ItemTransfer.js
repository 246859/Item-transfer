const BASE_DIR = "./plugins/ItemTransfer/";
const CONFIG_PATH = BASE_DIR + "Config.json";
const DATA_PATH = BASE_DIR + "Data.json";
const LANG_PATH = BASE_DIR + "Lang.json";

const DEFAULT_CONFIG = {
    //是否开启背包与箱子间的物品转移
    pack2boxTransfer: true,
    //是否开启箱子与箱子间的物品转移
    box2boxTransfer: true,
};

const DEFAULT_LANG = {
    FORM: {
        MAIN_TITLE: "§l物品转移",
        PACK_2_BOX: {
            NAME:"§l背包转移",
            IMG:"textures/blocks/beehive_front.png",
            ORDER:0,
        },
        BOX_2_BOX: {
            NAME:"§l箱子转移",
            IMG:"textures/blocks/chest_front.png",
            ORDER:1
        },
        GIVE_UP: {
            NAME: "§l放弃转移",
            IMG:"textures/ui/book_trash_default.png",
            ORDER:2
        }
    },
    INFO: {
        PACK_2_BOX: {
            START: "潜行点击一个要转移的箱子,或/trans giveup退出",
        },
        BOX_2_BOX: {
            BOXA: "潜行点击待转移的箱子A,或/trans giveup退出",
            BOXB: "潜行点击要转移的箱子B,或/trans giveup退出",
        }
    },
    ERROR: {
        IO: {
            READ: "json文件读取出错||Error reading json file:",
            WRITE: "json文件保存出错||Error writing json file:",
            INIT: "file init error:",
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
    ROOT_ACTION: {
        NAME: "do",
        TYPE: ParamType.Enum,
        EnumOption: 1
    }
}


const DEFAULT_DATA = [];

//运行时 玩家map
let plMap = new Map();
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
        mc.broadcast('§4debug:' + data.toString());
    }

    static isNUll(param) {
        return param === null || param === undefined;
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

    //初始化配置文件
    static initFile() {
        try {
            if (!File.exists(BASE_DIR))
                File.mkdir(BASE_DIR);
            if (!File.exists(CONFIG_PATH))
                Utils.writeFile(CONFIG_PATH, DEFAULT_CONFIG);
            if (!File.exists(LANG_PATH))
                Utils.writeFile(LANG_PATH, DEFAULT_LANG);
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

        //闭包回调
        function cmdCallBack(cmd, origin, output, results) {
            if (!Utils.hasNull(cmd, origin, output, results)) {

                Utils.debug("res:" + JSON.stringify(results));
                Utils.debug("cmd:" + JSON.stringify(cmd));
                Utils.debug("ori:" + JSON.stringify(origin));
                let pl = origin.player;

                switch (results[DEFAULT_CMD.ROOT_ACTION.NAME]) {
                    //p2b
                    case DEFAULT_CMD.TRANSFER_ACTION.VALUES[0] : {

                    }
                        break;
                    //b2b
                    case DEFAULT_CMD.TRANSFER_ACTION.VALUES[1] : {

                    }
                        break;
                    //giveup
                    case DEFAULT_CMD.BASE_ACTION.VALUES[0] : {

                    }
                        break;
                    // gui
                    case DEFAULT_CMD.GUI_ACTION.VALUES[0] : {
                        if (!Utils.isNUll(pl))
                            pl.sendForm(Form.mainForm(),Form.mainFormCallBack);
                    }
                }
            }
        }

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

        //参数重载
        cmd.overload([DEFAULT_CMD.TRANSFER_ACTION.NAME]);

        cmd.overload([DEFAULT_CMD.BASE_ACTION.NAME]);

        cmd.overload([DEFAULT_CMD.GUI_ACTION.NAME]);

        //回调设置
        cmd.setCallback(cmdCallBack);

        //安装
        cmd.setup();

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
        fm.addButton(LANG.FORM.PACK_2_BOX.NAME,LANG.FORM.PACK_2_BOX.IMG);
        fm.addButton(LANG.FORM.BOX_2_BOX.NAME,LANG.FORM.BOX_2_BOX.IMG);
        fm.addButton(LANG.FORM.GIVE_UP.NAME,LANG.FORM.GIVE_UP.IMG);
        return fm;
    }

    //主菜单回调
    static mainFormCallBack(pl, id) {
        if (!Utils.hasNull(pl,id)){
            Utils.debug(id);
            switch (id){
                case LANG.FORM.PACK_2_BOX.ORDER:{

                }break;
                case LANG.FORM.BOX_2_BOX.ORDER:{

                }break;
                case LANG.FORM.GIVE_UP.ORDER:{

                }break;
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

logger.info("ItemTransfer init successfully!");
logger.info("Author:stranger");
logger.info("Version:v1.0.1");

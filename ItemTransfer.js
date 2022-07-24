const BASE_DIR = "./plugins/ItemTransfer/";
const CONFIG_PATH = "Config.json";
const DATA_PATH = "Data.json";
const LANG_PATH = "Lang.json";

const DEFAULT_CONFIG = {
    //是否开启背包与箱子间的物品转移
    pack2boxTransfer: true,
    //是否开启箱子与箱子间的物品转移
    box2boxTransfer: true,
};

const DEFAULT_LANG = {
    FORM: {
        MAIN_TITLE: "物品转移",
        PACK_2_BOX: "背包转移",
        BOX_2_BOX: "箱子转移",
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
        description: "物品转移/Item transfer",
        permission: PermType.Any
    },
    P2B: {
        CMD: "P2B",
        TYPE: ParamType.RawText
    },
    B2B: {
        CMD: "B2B",
        TYPE: ParamType.RawText
    },
    GIVE_UP: {
        CMD: "giveUp",
        TYPE: ParamType.RawText
    }
}


const DEFAULT_DATA = [];

//运行时 玩家map
let plMap = new Map();
let config = {};

/**
 * 工具操作封装
 */
class Utils {
    static stringfy(data) {
        return data ? null : JSON.stringify(data);
    }

    static debug(...data) {
        mc.broadcast('§4debug:', data.toString());
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
        if ((configBuffer = Utils.readFile(CONFIG_PATH)))
            config = configBuffer;
    }

    //注册指令
    static registerCommand() {

        function cmdCallBack(cmd, origin, output, results) {
            if (!Utils.hasNull(cmd, origin, output, results)) {

            }
        }

        //顶层命令注册
        let cmd = mc.newCommand(
            DEFAULT_CMD.ROOT.CMD,
            DEFAULT_CMD.ROOT.description,
            DEFAULT_CMD.ROOT.permission);

        //必选参数P2B
        cmd.mandatory(
            DEFAULT_CMD.P2B.CMD,
            DEFAULT_CMD.P2B.TYPE
        );

        // 必选参数B2B
        cmd.mandatory(
            DEFAULT_CMD.B2B.CMD,
            DEFAULT_CMD.B2B.TYPE
        );

        //必选参数giveUp
        cmd.mandatory(
            DEFAULT_CMD.GIVE_UP.CMD,
            DEFAULT_CMD.GIVE_UP.TYPE
        );

        //参数重载
        cmd.overload([]);


        //安装
        cmd.setup();
    }
}

/**
 * 表单封装
 */
class Form {
    static mainForm() {
        let fm = mc.newSimpleForm();
        fm = fm.setTitle(DEFAULT_LANG.FORM.MAIN_TITLE);
        fm = fm.addButton(DEFAULT_LANG.FORM.PACK_2_BOX);
        return fm.addButton(DEFAULT_LANG.FORM.BOX_2_BOX);
    }
}


function init() {
    Utils.initFile();
    Utils.initData();
}


init();

logger.info("ItemTransfer init successfully!");
logger.info("Author:stranger");
logger.info("Version:v1.0.1");

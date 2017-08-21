/**
 *****************************************
 * Created by lifx
 * Created on 2017-08-21 15:00:59
 *****************************************
 */
'use strict';


/**
 *****************************************
 * 加载依赖
 *****************************************
 */
const
    fs = require('fs'),
    path = require('path'),
    promisify = require('util').promisify,
    xml = require('xml2js'),
    plist = require('plist'),
    readFile = promisify(fs.readFile),
    writeFile = promisify(fs.writeFile),
    parseXML = promisify(xml.parseString),
    builder = new xml.Builder({
        xmldec: {
            version: '1.0',
            encoding: 'UTF-8'
        }
    });


/**
 *****************************************
 * 抛出接口
 *****************************************
 */
module.exports = async ctx => {
    let dir = (...args) => path.resolve(ctx.opts.projectRoot, ...args),
        config = await parseXML(await readFile(dir('config.xml'), 'utf-8')),
        displayName = (config.widget['display-name'] || [])[0];


    if (displayName) {

        // 遍历【app】平台
        for (let platform of ctx.opts.platforms) {

            // 处理【ios】平台
            if (platform === 'ios') {

                let name = config.widget.name,
                    src = dir(`platforms/ios/${ name }/${ name }-Info.plist`),
                    settings = plist.parse(await readFile(src, 'utf-8'));

                // 设置名称
                settings.CFBundleDisplayName = displayName;

                // 保存配置
                await writeFile(src, plist.build(settings));
            }

            // 处理【android】平台
            if (platform === 'android') {
                let src = dir('platforms/android/res/values/strings.xml'),
                    settings = await parseXML(await readFile(src, 'utf-8')),
                    flag = false;

                // 设置名称
                for (let item of settings.resources.string) {
                    if (item.$.name === 'app_name') {
                        item._ = displayName;
                        flag = true;
                        break;
                    }
                }

                // 保存配置
                flag && await writeFile(src, builder.buildObject(settings));
            }
        }
    }
};


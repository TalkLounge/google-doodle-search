const { program } = require("commander");
const axios = require("axios");
const fs = require("fs");

async function init(type, desc) {
    try {
        fs.mkdirSync("data")
    } catch (e) {
    }

    try {
        fs.writeFileSync("data/list.csv", "Year,Month,Doodle Type,Description,Link");
    } catch (e) {
    }

    let list = [];

    console.log("Reading from file...");

    try {
        list = JSON.parse(fs.readFileSync("data/list.json", "utf8").trim());
    } catch (e) {
    }

    for (let year = list.length ? list[list.length - 1].year : 1999; year <= (new Date()).getFullYear(); year++) {
        for (let month = 1; month <= 12; month++) {
            if ((year == 1999 && month < 10) ||
                (year == (new Date()).getFullYear() && month > (new Date()).getMonth() + 1) ||
                list.length && year == list[list.length - 1].year && month < list[list.length - 1].month) {
                continue;
            }

            console.log("Downloading Doodles " + year + "/" + month + "...");

            let data = await axios.get(`https://www.google.com/doodles/json/${year}/${month}?hl=de&full=1`);
            if (list.length && year == list[list.length - 1].year && month == list[list.length - 1].month) {
                list[list.length - 1].data = data.data;
            } else {
                list.push({ year: year, month: month, data: data.data });
            }
        }
    }

    try {
        fs.unlinkSync("data/list.json");
    } catch (e) {
    }

    console.log("Writing to file...");

    try {
        fs.appendFileSync("data/list.json", "[");
        list.forEach(function (element, index) {
            fs.appendFileSync("data/list.json", JSON.stringify(element) + (index != list.length - 1 ? "," : ""));
        });
        fs.appendFileSync("data/list.json", "]");
    } catch (e) {
        console.error(e);
    }

    for (let i = 0; i < list.length; i++) {
        for (let j = 0; j < list[i].data.length; j++) {
            if ((type && desc && list[i].data[j].doodle_type.indexOf(type) != -1 && list[i].data[j].blog_text.toLowerCase().indexOf(desc) != -1) ||
                (type && list[i].data[j].doodle_type.indexOf(type) != -1 && !desc) ||
                (desc && list[i].data[j].blog_text.toLowerCase().indexOf(desc) != -1 && !type)) {
                console.log(list[i].year, list[i].month, type || null, desc || null, `https://www.google.com/doodles/${list[i].data[j].name}`);

                try {
                    fs.appendFileSync("data/list.csv", `\n${list[i].year},${list[i].month},${type || null},${desc || null},https://www.google.com/doodles/${list[i].data[j].name}`);
                } catch (e) {
                }
            }
        }
    }
}

program.version("1.0.0")
    .description("Command Line Tool to search Goodle Doodles for keywords and write to a CSV file")
    .name("node src/index.js")
    .option("-t, --type <query>", "filter by doodle type")
    .option("-d, --desc <query>", "filter in description")
    .action(async function (options) {
        if (options.type) {
            options.type = options.type.toLowerCase();
        }

        if (options.desc) {
            options.desc = options.desc.toLowerCase();
        }

        try {
            await init(options.type, options.desc);
            process.exit();
        } catch (e) {
            console.error("An error occurred");
            console.error(process.argv);
            console.error(e);
            process.exit(1);
        }
    }).addHelpText("after", `
Known doodle types:
    - simple
    - interactive
    - video template
    - random
    - inline interactive
    - slideshow
    - animated

Examples:
    node src/index.js --type interactive --desc game`
    );

program.showSuggestionAfterError();
program.showHelpAfterError();
program.parse();

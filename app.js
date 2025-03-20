let pl_build = document.querySelector(".pl-build");
let pl_units = document.querySelector(".pl-units");
let pl_attack = document.querySelector(".pl-attack");
let pl_attack_text_wrap = document.querySelector(".pl-attack-text-wrap");
let pl_attack_text = document.querySelector(".pl-attack-text");
let op_build = document.querySelector(".op-build");
let op_units = document.querySelector(".op-units");
let op_attack = document.querySelector(".op-attack");
let op_attack_text_wrap = document.querySelector(".op-attack-text-wrap");
let op_attack_text = document.querySelector(".op-attack-text");

let pl_wrap = document.querySelector(".wrap-pl-lists");
let op_wrap = document.querySelector(".wrap-op-lists");
let mainmenu = document.querySelector(".mainmenu");

const bldlist = ["Жилой район", "Колодец", "Оборонные сооружения", "Щит"];
const bldlvls = [6, 1, -1, 2]; // Максимальные уровни; -1 - неограничено

const unilist = ["Ползун, ур. 1", "Ползун, ур. 2", "Заготовка", "Летающая заготовка", "Бомбардировщик"];
const uniconstruct = [0, 2]; // Те юниты, что можно сконструировать
const uniupgrade = {0:1, 2:3, 3:4}; // Руководство, как улучшать юнитов
const unifinal = [1, 4] // Те юниты, что не улучшаются больше
const unidamage = [1, 2, 0, 0, 3]; // Урон юнитов. Не атакующие - 0
const unihealth = [1, 2, 1, 1, 3]; // Прочность юнитов

const check_turn_code = "power--;(turn?op_attack:pl_attack).style.display='none';if(power==0){water();if(canattack()&&turns>10){(turn?pl_attack:op_attack).style.display='block';}turn=!turn;turns++;update_power();}reload_text(true);"; // Вынесен для удобства: повторяется в коде 3 раза

// Основная работа происходит с этими списками: 
let pl_build_list = {"Жилой район":1, "Колодец":0, "Оборонные сооружения":0, "Щит":0};
let pl_units_list = {"Ползун, ур. 1":0, "Ползун, ур. 2":0, "Заготовка":0, "Летающая заготовка":0, "Бомбардировщик":0};
let op_build_list = {"Жилой район":1, "Колодец":0, "Оборонные сооружения":0, "Щит":0};
let op_units_list = {"Ползун, ур. 1":0, "Ползун, ур. 2":0, "Заготовка":0, "Летающая заготовка":0, "Бомбардировщик":0};

let game = true,
    power = 1, // Количество Энергии ходящего игрока ИЛИ количество не стрелявших Оборонных сооружений во время Атаки (акта Обороны)
    turn = true, // Чей ход: true - левого, false - правого
    turns = 0, // Количество ходов с начала игры или с последней атаки
    attacker = [], // Атакующие юниты
    attacking = 0, // Индекс атакующего юнита во время Атаки
    pl_without_water = 0, // Сколько ходов прошло без Колодца
    op_without_water = 0;

function water() {
    if((turn?pl_build_list:op_build_list)['Колодец'] == 0){
        (turn?pl_without_water++:op_without_water++);
    }
}

function update_power() {
    let temp = (turn?pl_build_list:op_build_list)["Жилой район"]
    power = (temp<=4)?1:((temp==5)?2:((Math.random()<0.25)?3:2))
}

function reload_text(opts) {
    pl_build.innerHTML = "";
    pl_units.innerHTML = "";
    op_build.innerHTML = "";
    op_units.innerHTML = "";
    for (let key in pl_build_list) {
        if (pl_build_list[key] != 0) {
            pl_build.innerHTML += `<li>${key}, ур. ${pl_build_list[key]}</li>`;
        }
    }
    for (let key in pl_units_list) {
        if (pl_units_list[key] != 0) {
            pl_units.innerHTML += `<li>${key}, ${pl_units_list[key]} шт.</li>`;
        }
    }
    if (pl_build.innerHTML == "") {
        pl_build.innerHTML = "Ничего: победа врага!";
        game = false;
    }
    if (pl_units.innerHTML == "") {
        pl_units.innerHTML = "Пока ничего";
    }
    for (let key in op_build_list) {
        if (op_build_list[key] != 0) {
            op_build.innerHTML += `<li>${key}, ур. ${op_build_list[key]}</li>`;
        }
    }
    for (let key in op_units_list) {
        if (op_units_list[key] != 0) {
            op_units.innerHTML += `<li>${key}, ${op_units_list[key]} шт.</li>`;
        }
    }
    if (op_build.innerHTML == "") {
        op_build.innerHTML = "Ничего: победа ваша!";
        game = false;
    }
    if (op_units.innerHTML == "") {
        op_units.innerHTML = "Пока ничего";
    }
    if (game && opts) {
        if (pl_build_list["Колодец"] != 0) pl_without_water=0;
        if (op_build_list["Колодец"] != 0) op_without_water=0;
        if ((turn?pl_without_water:op_without_water) == 4 && (turn?pl_build_list:op_build_list)["Колодец"] == 0) {
            // Заглушка. Если Колодца нет четыре хода, выполнение закончится здесь
            (turn?pl_build:op_build).innerHTML += `<li onclick=\"${turn?"pl":"op"}_build_list[\'Колодец\']++;`+check_turn_code+`\" class=\"clickable\">Построить \"Колодец\"</li>`;
        } else if (power > 0) {
            for (let i = 0; i < bldlist.length; i++) {
                if ((turn?pl_build_list:op_build_list)[bldlist[i]] < bldlvls[i] || bldlvls[i] == -1) {
                    // Выводим, какие опции для постройки/улучшения построек
                    (turn?pl_build:op_build).innerHTML += `<li
                    onclick=\"
                    ${turn?"pl":"op"}_build_list[\'${bldlist[i]}\']++;`+check_turn_code+`\"
                    class=\"clickable\">${(turn?pl_build_list:op_build_list)[bldlist[i]]>0?"Улучшить":"Построить"} \"${bldlist[i]}\"</li>`;
                }
            }
            (turn?pl_build:op_build).innerHTML += `Осталось ходов: ${power}`;
            for (let i = 0; i < unilist.length; i++) {
                if (uniconstruct.includes(i) || canupgrade(i)) {
                    // Этот код отнимает 1 от количества улучшаемого юнита и прибавляет 1 к количеству улучшенного юнита (если это улучшаемый юнит) ИЛИ прибавляет 1 к количеству построенного юнита, т. е., реализует постройку юнитов
                    (turn?pl_units:op_units).innerHTML += `<li
                    onclick=\"
                    ${uniconstruct.includes(i)?
                        `${turn?"pl":"op"}_units_list[\'${unilist[i]}\']++`
                        :
                        `${turn?"pl":"op"}_units_list[\'${unilist[findkey(uniupgrade, i)]}\']--;
                            ${turn?"pl":"op"}_units_list[\'${unilist[i]}\']++;`};
                    `+check_turn_code+`\"
                    class=\"clickable\">Построить \"${unilist[i]}\"</li>`;
                }
            }
            (turn?pl_units:op_units).innerHTML += `Осталось ходов: ${power}`;
        }
    }
}

function reload_attack_opts() {
    reload_text(false); // Очищаем все опции, чтобы обновить их
    (turn?pl_attack_text:op_attack_text).innerHTML = "";
    console.log((turn?pl_attack_text:op_attack_text).innerHTML);
    for (let i = 0; i < attacker.length; i++) {
        // Акт Атаки. Выводим атакующие юниты и инфо о них
        (turn?pl_attack_text:op_attack_text).innerHTML += `<li class=\"attack${(attacking==i||power!=-1)?" bold":""}\">${unilist[attacker[i]["id"]]}, прочность ${attacker[i]["health"]}, урон ${attacker[i]["damage"]}${(attacking==i)?" < атакует сейчас.":""}</li>`;
    }
    if (attacking == attacker.length || power != -1) {
        if (power == -1) {
            // Последний атакующий юнит только что атаковал. Начинается акт Обороны
            power = (turn?pl_build_list:op_build_list)["Оборонные сооружения"];
        }
        if (power == 0 || attacker.length == 0) {
            // Акт Обороны закончился: либо закончились атакующие, либо действующие обороняющиеся. Не побежденные юниты (при наличии таковых) возвращаются, реэим Атаки выключается.
            for (let i = 0; i < attacker.length; i ++) {
                (turn?op_units_list:pl_units_list)[unilist[attacker[i]["id"]]]++;
            }
            (turn?pl_attack_text_wrap:op_attack_text_wrap).style.display = "none";
            turns = 5; // Уже через 5 ходов можно будет атаковать снова. Костыль, но более элегантного решения будто бы нет
            update_power();
            reload_text(true);
        } else {
            for (let i = 0; i < attacker.length; i++) {
                // Акт Обороны. Выводим опции, от кого обороняться
                (turn?pl_attack_text:op_attack_text).innerHTML += `<li class=\"clickable attack\" onclick=\"power=Math.max(0, power-attacker[${i}][\'health\']);${(attacker[i]['health']<=power)?`attacker.splice(${i}, 1)`:`attacker[${i}][\'health\']-=${power}`};reload_attack_opts();\">Обороняться от \"${unilist[attacker[i]["id"]]}, прочность ${attacker[i]["health"]}\"</li>`;
            }
        }
    } else {
        if ((turn?pl_build_list:op_build_list)["Щит"] > 0) {
            // Акт Атаки. Заглушка: если у обороняющегося есть Щит, то выполнение закончится здесь
            (turn?pl_build:op_build).innerHTML += `<li class=\"clickable attack\" onclick=\"${turn?"pl":"op"}_build_list[\'Щит\']=Math.max(0, ${turn?"pl":"op"}_build_list[\'Щит\']-${attacker[attacking]["damage"]});attacking ++;(attacking<=attacker.length)?(reload_attack_opts()):(reload_text(true));">Атаковать \"Щит\"</li>`;
        } else {
            for (let i = 0; i < bldlist.length; i ++) {
                if ((turn?pl_build_list:op_build_list)[bldlist[i]] > 0) {
                    // Акт Атаки. Выводим, какие постройки атаковать
                    (turn?pl_build:op_build).innerHTML += `<li class=\"clickable attack\" onclick="${turn?"pl":"op"}_build_list[\'${bldlist[i]}\']=Math.max(0, ${turn?"pl":"op"}_build_list[\'${bldlist[i]}\']-${attacker[attacking]["damage"]});attacking++;(attacking<=attacker.length)?(reload_attack_opts()):(reload_text(true));\">Атаковать \"${bldlist[i]}\"</li>`;
                }
            }
            for (let i = 0; i < unilist.length; i ++) {
                if ((turn?pl_units_list:op_units_list)[unilist[i]] > 0) {
                    // Акт Атаки. Выводим, каких юнитов атаковать
                    (turn?pl_units:op_units).innerHTML += `<li class=\"clickable attack\" onclick="${turn?"pl":"op"}_units_list[\'${unilist[i]}\']=Math.max(0, ${turn?"pl":"op"}_units_list[\'${unilist[i]}\']-${attacker[attacking]["damage"]});attacking++;(attacking<=attacker.length)?(reload_attack_opts()):(reload_text(true));\">Атаковать \"${unilist[i]}\"</li>`;
                }
            }
        }
    }
}

function canupgrade(identifier) {
    return (turn?pl_units_list:op_units_list)[unilist[findkey(uniupgrade, identifier)]] > 0;
}

function findkey(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

function canattack() {
    for (let i = 0; i < unilist.length; i++) {
        if ((turn?pl_units_list:op_units_list)[unilist[i]] != 0 && unidamage[i] != 0) {
            return true;
        }
    }
    return false;
}

function attack() {
    attacker = [];
    power = 0;
    reload_text(false);
    power = -1;
    attacking = 0;
    (turn?op_attack:pl_attack).style.display = "none";
    (turn?pl_attack_text_wrap:op_attack_text_wrap).style.display = "block";
    for (let i = 0; i < unilist.length; i++) {
        if (unidamage[i] != 0) {
            for (let j = 0; j < (turn?op_units_list:pl_units_list)[unilist[i]]; j++) {
                attacker.push({"id":i, "health":unihealth[i], "damage":unidamage[i]});
            }
            (turn?op_units_list:pl_units_list)[unilist[i]] = 0;
        }
    }
    reload_attack_opts();
}

function start_game() {
    mainmenu.style.opacity = "0.0";
    setTimeout(() => {
        mainmenu.style.display = "none";
        pl_wrap.style.display = "block";
        op_wrap.style.display = "block";
        reload_text(true);
    }, 1000);
}

// TODO: выйти из спаггетти-кода, разделить всё на более мелкие функции
// TODO: сделать все более понятным (строки 97 и другие большие)
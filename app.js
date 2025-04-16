function r_e(id) {
  return document.querySelector(`#${id}`);
}

function buy_new_lane() {
  if (highway.get_bank() < highway.get_new_lane_cost()) {
    console.log("Too broke");
  } else {
    highway.add_new_lane();
    console.log("Bought new lane");
  }
}

function increase_efficiency() {
  if (highway.get_bank() < highway.get_efficiency_inc_cost()) {
    console.log("Too broke");
  } else {
    highway.increase_efficiency();
    console.log("Bought efficiency increase");
  }
}

function increase_lane_cost(id) {
  const lane = highway.get_lane(id);
  if (highway.get_bank() < lane.get_cost()) {
    console.log("Too broke");
  } else {
    lane.increase_cost(1);
    console.log("Increased lane cost");
  }
}

function increase_lane_cost_10(id) {
  const lane = highway.get_lane(id);
  if (highway.get_bank() < lane.get_cost() * 10) {
    console.log("Too broke");
  } else {
    lane.increase_cost(10);
    console.log("Increased lane cost");
  }
}

function increase_lane_cost_100(id) {
  const lane = highway.get_lane(id);
  if (highway.get_bank() < lane.get_cost() * 100) {
    console.log("Too broke");
  } else {
    lane.increase_cost(100);
    console.log("Increased lane cost");
  }
}

function claim_toll(id) {
  const lane = highway.get_lane(id);
  highway.set_bank(lane.get_cost());
  update_details();
}

function buy_auto_toll(id) {
  const lane = highway.get_lane(id);
  lane.set_auto_toll_bought();
  update_lanes();
}

function update_details() {
  r_e("bank").innerHTML = highway.get_bank();
  r_e("num_lanes").innerHTML = highway.get_num_lanes();
  r_e("efficiency").innerHTML = highway.get_speed();
}

function update_shop() {
  r_e("num_lanes").innerHTML = highway.get_num_lanes();
  r_e("new_lane_cost").innerHTML = highway.get_new_lane_cost();
  r_e("efficiency").innerHTML = highway.get_speed();
  r_e("efficiency_inc_cost").innerHTML = highway.get_efficiency_inc_cost();
}

function update_lanes() {
  const lanes_div = r_e("lanes");
  lanes_div.innerHTML = "";

  const lanes = highway.get_to_lanes();
  lanes.forEach((lane) => {
    const lane_id = lane.get_id();
    const lane_cost = lane.get_cost();
    const inc_cost_price = lane.get_inc_cost_price();
    const lane_auto_toll_status = lane.get_auto_toll_status();

    lanes_div.innerHTML += `
            <div class="lane cell is-col-min-7 box">
              <p>Lane ID: ${lane_id}</p>
              <p>Toll Cost: ${lane_cost}</p>
              <p>Increase Cost Price: ${inc_cost_price}</p>
              <button class="button" onclick="increase_lane_cost(${lane_id})">Increase cost</button>
              <button class="button" onclick="increase_lane_cost_10(${lane_id})">Increase cost 10</button>
              <button class="button" onclick="increase_lane_cost_100(${lane_id})">Increase cost 100</button>
              ${
                lane_auto_toll_status
                  ? ``
                  : `
                    <p>Auto Toll Cost: 10</p>
                    <button class="button" onclick="claim_toll(${lane_id})">Claim Toll</button>
                    <button class="button" onclick="buy_auto_toll(${lane_id})">Buy Auto Toll</button>
                  `
              }
            </div>
          `;
  });
}

class Highway {
  constructor() {
    this.to_lanes = [new Lane(1)];
    this.name = "";
    this.speed = 2000;
    this.bank = 0;
    this.new_lane_cost = 10;
    this.efficiency_inc_cost = 20;
    this.start_date = new Date().getTime();
    this.next_update = this.start_date;
  }

  get_num_lanes() {
    return this.to_lanes.length;
  }

  add_new_lane() {
    this.bank -= this.new_lane_cost;
    this.to_lanes.push(new Lane(this.to_lanes.length + 1));
    this.new_lane_cost *= 2;

    update_details();
    update_shop();
    update_lanes();
  }

  increase_efficiency() {
    this.bank -= this.efficiency_inc_cost;
    this.speed -= 150;
    this.efficiency_inc_cost *= 2;

    update_details();
    update_shop();
  }

  get_to_lanes() {
    return this.to_lanes;
  }

  get_auto_toll_lanes() {
    return this.to_lanes.filter((lane) => lane.get_auto_toll_status() === true);
  }

  get_speed() {
    return this.speed;
  }

  get_bank() {
    return this.bank;
  }

  set_bank(amount) {
    this.bank += amount;
  }

  get_new_lane_cost() {
    return this.new_lane_cost;
  }

  get_efficiency_inc_cost() {
    return this.efficiency_inc_cost;
  }

  get_lane(id) {
    return this.to_lanes.filter((lane) => lane.get_id() === id)[0];
  }

  details() {
    return `Highway: ${this.name}, To Lanes: ${this.to_lanes.length}`;
  }

  update(time) {
    if (time >= this.next_update) {
      this.next_update += this.speed;

      const to_lanes = this.get_auto_toll_lanes();
      for (let i = 0; i < to_lanes.length; i++) {
        this.set_bank(to_lanes[i].get_cost());
      }

      update_details();
    }
  }
}

class Lane {
  constructor(id) {
    this.id = id;
    this.cost = 1;
    this.inc_cost_price = 10;
    this.auto_toll_bought = false;
  }

  get_id() {
    return this.id;
  }

  get_cost() {
    return this.cost;
  }

  get_inc_cost_price() {
    return this.inc_cost_price;
  }

  increase_cost(amount) {
    highway.set_bank(-this.inc_cost_price * amount);
    this.cost += amount;
    this.inc_cost_price += 10 * amount;

    update_lanes();
  }

  get_auto_toll_status() {
    return this.auto_toll_bought;
  }

  set_auto_toll_bought() {
    this.auto_toll_bought = true;
  }
}

const highway = new Highway();

function pageSetup() {
  update_details();
  update_shop();
  update_lanes();
}

setInterval(() => {
  highway.update(new Date().getTime());
}, 10);

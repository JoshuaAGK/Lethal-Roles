const readline = require('readline');
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

class Person {
    constructor(name) {
        this.name = name;
        this.role = null;
    }

    assignRole(role) {
        this.role = role;
    }

	clearRole() {
		this.role = null;
	}
}

class Role {
    constructor(name, maximumCount = Infinity) {
        this.name = name;
        this.maximumCount = maximumCount;
    }
}

class RoleManager {
    constructor() {
        this.persons = [];
        this.roles = [];
		this.day = 0;
    }

    addPerson(person) {
        if (!(person instanceof Person)) {
            throw new TypeError("Expected an instance of Person");
        }
		let unsetPersons = this.persons.filter(person => person.role == null);
		if (unsetPersons.length == 0 && this.persons.length > 0) {
			person.assignRole(this.roles[this.findNextAvailableRoleIndex()].name);
		}
		this.persons.push(person);
    }

	removePerson(name) {
        this.persons = this.persons.filter(person => person.name.toLowerCase() !== name.toLowerCase());

        let availableRoles = [];
        let mostPopulatedRole;
		let personsInMostPopulatedRole = this.persons;


        for (const role of this.roles) {
            mostPopulatedRole = this.countPersonsInRole(role.name) > this.countPersonsInRole(mostPopulatedRole?.name) ? role : mostPopulatedRole;

            if (this.isRoleAvailableForAssignment(role)) {
                availableRoles.push(role);
            }
        }

		if (availableRoles.length > 1) {
			availableRoles.sort((a, b) => a.maximumCount - b.maximumCount);
			personsInMostPopulatedRole = personsInMostPopulatedRole.filter(person => person.role == mostPopulatedRole.name);
			personsInMostPopulatedRole[personsInMostPopulatedRole.length - 1].role = availableRoles[0].name;
		}
    }

    addRole(role) {
        if (!(role instanceof Role)) {
            throw new TypeError("Expected an instance of Role");
        }
        this.roles.push(role);
    }

	changeRoleMaxCount(name, maximumCount) {
        const role = this.roles.find(role => role.name === name);
        if (role) {
            role.maximumCount = maximumCount;
        }
    }

    initializeDistribution() {
        this.assignInitialRoles();
        this.evenlyDistributeRoles();
    }

    assignInitialRoles() {
		this.persons.forEach(person => {
            person.clearRole();
        });
        this.persons.forEach(person => {
            const roleIndex = this.findNextAvailableRoleIndex();
            person.assignRole(this.roles[roleIndex].name);
        });
    }

    findNextAvailableRoleIndex() {
        let index = 0;
        do {
            if (this.isRoleAvailableForAssignment(this.roles[index])) {
                return index;
            }
            index = (index + 1) % this.roles.length;
        } while (index !== 0);
        throw "No available roles for assignment";
    }

    isRoleAvailableForAssignment(role) {
        return this.countPersonsInRole(role.name) < role.maximumCount;
    }

    countPersonsInRole(roleName) {
        return this.persons.filter(person => person.role === roleName).length;
    }

    evenlyDistributeRoles() {
        const rolesWithPeople = this.groupPersonsByRole();
        this.distributeRoles(rolesWithPeople);
    }

    groupPersonsByRole() {
        return this.persons.reduce((groupedRoles, person) => {
            const role = person.role || "Unassigned";
            groupedRoles[role] = groupedRoles[role] || [];
            groupedRoles[role].push(person);
            return groupedRoles;
        }, {});
    }

    distributeRoles(rolesWithPeople) {
		const sortedRoles = Object.keys(rolesWithPeople).sort((a, b) => rolesWithPeople[b].length - rolesWithPeople[a].length);
        let lastRole = null;
        let distribution = [];

        while (distribution.length < this.persons.length) {
            const nextRole = sortedRoles.find(role => rolesWithPeople[role].length > 0 && role !== lastRole);
            if (!nextRole) {
                break;
            }
            lastRole = nextRole;
            distribution.push(rolesWithPeople[nextRole].shift());
            this.resortRolesByRemainingCount(sortedRoles, rolesWithPeople, lastRole);
        }
        this.persons = distribution;
    }

    resortRolesByRemainingCount(sortedRoles, rolesWithPeople, lastRole) {
        sortedRoles.sort((a, b) => rolesWithPeople[b].length - rolesWithPeople[a].length || (a === lastRole ? 1 : -1));
    }

    cycleRoles(cycleAmount) {
		cycleAmount = cycleAmount % this.persons.length;
		let orderedRoles = this.persons.map(person => person.role);
		orderedRoles = [...orderedRoles.slice(cycleAmount), ...orderedRoles.slice(0, cycleAmount)];

		this.persons.forEach((person, i) => {
			person.role = orderedRoles[i];
		});

		this.day++;
    }

	handleCommand(command) {
        const [action, ...args] = command.split(' ');
        switch (action.toLowerCase()) {
            case 'addperson':
                this.addPerson(new Person(args[0]));
                break;
            case 'remove':
                this.removePerson(args[0]);
                break;
            case 'addrole':
                this.addRole(new Role(args[0], parseInt(args[1], 10) || Infinity));
                break;
            case 'changemaxcount':
                this.changeRoleMaxCount(args[0], parseInt(args[1], 10));
                break;
            case 'cycle':
                this.cycleRoles(parseInt(args[0], 10) || 1);
                break;
            default:
                console.log('Unknown command. Try again.');
        }
    }

	reset() {
		this.persons = [];
		this.roles = [];
		this.day = 0;
	}
}

const roleManager = new RoleManager();

const persons = [
	new Person('Person 1'),
	new Person('Person 2'),
	new Person('Person 3'),
	new Person('Person 4')
];

const roles = [
	new Role('Shipper', 1),
	new Role('Ferrier', 1),
	new Role('Scrapper', Infinity)
];

persons.forEach(person => roleManager.addPerson(person));
roles.forEach(role => roleManager.addRole(role));

roleManager.initializeDistribution();

function printday() {
	console.log(`Quota ${Math.floor(roleManager.day / 3) + 1} day ${roleManager.day % 3 + 1}:`)
	console.log(roleManager.persons);
}

rl.on('line', (input) => {
	if (input) {
		roleManager.handleCommand(input);
	} else {
		roleManager.cycleRoles(1);
		printday();
	}
});

printday();
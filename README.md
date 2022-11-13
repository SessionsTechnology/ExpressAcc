<a name="readme-top"></a>

<!-- [![Contributors][contributors-shield]][contributors-url] -->
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
<!-- [![LinkedIn][linkedin-shield]][linkedin-url] -->



<!-- PROJECT LOGO -->
<br />
<div align="center">
  <!-- <a href="https://github.com/SessionsTechnology/ExpressAcc">
    <img src="images/logo.png" alt="Logo" width="80" height="80">
  </a> -->

  <h3 align="center">ExpressACC</h3>
  <p style="font-size: 11px;" align="center">(Until I find a better name)</p>
  <br />
  <p align="center">
    Express Activity Checkout Center/Task/Chore Manager
    <!-- <br />
    <a href="https://github.com/SessionsTechnology/ExpressAcc"><strong>Explore the docs »</strong></a> -->
    <br />
    <br />
    <!-- <a href="https://github.com/SessionsTechnology/ExpressAcc">View Demo</a>
    · -->
    Demo coming soon
    ·
    <a href="https://github.com/SessionsTechnology/ExpressAcc/issues">Report Bug</a>
    ·
    <a href="https://github.com/SessionsTechnology/ExpressAcc/issues">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->
## About The Project

<!-- [![Product Name Screen Shot][product-screenshot]](https://example.com) -->
* Currently stands as MVP for at least the user portion to check out and in items.

ExpressACC started as an idea for my kids to be able to manage their own time on devices. Instead of parents managing multiple kids and devices, the kids can manage their own time. It also includes an admin dashboard for parents/admins to be able to monitor time left. The goal is for this to expand to other places outside the home, such as school, church, etc.

As of right now, this is being built as a self-hosted docker container. I plan hosting a cloud solution in the near future.

This is a work in progress and is not ready for production use. I am not responsible for any damage or loss of data. Use at your own risk.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

Tool | Version
:---: | :---:
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)][Express-url] | [![Express][Express.js]][Express-url]
[![Vue](https://img.shields.io/badge/Vue-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)][Vue-url] | [![Vue][Vue.js]][Vue-url]
[![Vuetify](https://img.shields.io/badge/Vuetify-1867C0?style=for-the-badge&logo=vuetify&logoColor=white)][Vuetify-url] | [![Vuetify-beta][Vuetify.js]][Vuetify-url]
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)][Socket.io] | [![Socket.io][Socket.io]][Socket-url]
[![lowdb](https://img.shields.io/badge/lowdb-000000?style=for-the-badge&logo=lowdb&logoColor=white)][LowDb-url] | [![lowdb][lowdb]][lowdb-url]
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)][Vite-url] | [![Vite][Vite.js]][Vite-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started

#### Work in progress... Keep in mind things may change quickly.

### Prerequisites

This is an example of how to list things you need to use the software and how to install them.
* Nodejs >= 16.0.0
* Docker (recommended)
* Docker-compose (recommended)

### Installation

<!-- 1. Get a free API Key at [https://example.com](https://example.com) -->
1. Clone the repo
   ```sh
   git clone https://github.com/SessionsTechnology/ExpressAcc.git && cd ExpressAcc
   ```
2. Install NPM packages
   ```sh
   npm run setup
   ```
3. Run the app
   ```js
   npm run dev
   ```

The above steps will currently run the application with a default port of 3001 locally. If you wish to run the app in docker, you can run the following command to build the docker image and run the container.

```sh
docker build -t expressacc:latest . && docker run -d -p 3001:3001 expressacc:latest
```

You can also create a volume to persist the data. This will allow you to update the container without losing your data.

```sh
docker build -t expressacc:latest . && docker run -d -p 3001:3001 -v expressacc-data:/app/lowdb expressacc:latest
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->
## Usage

1. As you start the app, you will see an error in the console `TypeError: Cannot read properties of undefined (reading 'find')`. This will continue to log until you go to the app in your browser and run the first setup (simple two fields for now).

2. Once you have completed the setup, you will see two buttons, one for Checkout and one for Admin. You can click on the Admin button to see the admin dashboard. The admin dashboard will show you the current time left for each user (more functionality to come). There is a settings button that will take you to the settins page.

3. The settings page will allow you to setup how much time each weekday a 'User' will have for items marked as 'Timed', add new users, and add new items.

4. From here you can go to the Checkout screen to allow your 'Users' to checkout items.

<!-- _For more examples, please refer to the [Documentation](https://example.com)_ -->

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ROADMAP -->
## Roadmap

- [ ] Initial Open Source Release
   - [ ] Publish initial commit
   - [ ] Finish Admin Dashboard
   - [ ] Finish Admin Edit User
   - [ ] Code Cleanup and Refactor
   - [ ] Create Import/Export for db.json
- [ ] Create Task/Chore Management

See the [open issues](https://github.com/SessionsTechnology/ExpressAcc/issues) and [project dashboard](https://github.com/orgs/SessionsTechnology/projects/1) for a full list of proposed features (and known issues).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->
## License

Distributed under the AGPL-3.0 License. See `LICENSE` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->
## Contact

Matt Sessions - expressacc@sessionstech.com

Project Link: [https://github.com/SessionsTechnology/ExpressAcc](https://github.com/SessionsTechnology/ExpressAcc)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* Shoutout to all the tools listed in the [Built With](#built-with) section.
* Shoutout to my children for really enjoying the use of the app and even suggesting features.
* Shoutout to Family and Friends for their encouragement and extra ideas brought to the table.
* [othneildrew/Best-README-Template](https://github.com/othneildrew/Best-README-Template) for this lovely README template.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[forks-shield]: https://img.shields.io/github/forks/SessionsTechnology/ExpressAcc
[forks-url]: https://github.com/SessionsTechnology/ExpressAcc/network/members
[stars-shield]: https://img.shields.io/github/stars/SessionsTechnology/ExpressAcc
[stars-url]: https://github.com/SessionsTechnology/ExpressAcc/stargazers
[issues-shield]: https://img.shields.io/github/issues/SessionsTechnology/ExpressAcc
[issues-url]: https://github.com/SessionsTechnology/ExpressAcc/issues
[license-shield]: https://img.shields.io/github/license/SessionsTechnology/ExpressAcc
[license-url]: https://github.com/SessionsTechnology/ExpressAcc/blob/master/LICENSE.txt
[Vue.js]: https://img.shields.io/badge/Vue-3.2.45-green?style=for-the-badge
[Vue-url]: https://vuejs.org/
[Vuetify.js]: https://img.shields.io/badge/Vuetify-3.0.1-green?style=for-the-badge
[Vuetify-url]: https://next.vuetifyjs.com/en/
[Express.js]: https://img.shields.io/badge/Express-4.18.2-blue?style=for-the-badge
[Express-url]: https://expressjs.com/
[Socket.io]: https://img.shields.io/badge/Socket.io-5.1.2-blue?style=for-the-badge
[Socket-url]: https://socket.io/
[LowDB]: https://img.shields.io/badge/LowDB-5.0.5-blue?style=for-the-badge
[LowDB-url]: https://github.com/typicode/lowdb
[Vite.js]: https://img.shields.io/badge/Vite-3.0.9-blue?style=for-the-badge
[Vite-url]: https://vitejs.dev/
<!-- [linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555 -->
<!-- [linkedin-url]: https://linkedin.com/in/linkedin_username -->
<!-- [product-screenshot]: images/screenshot.png -->
<!-- [contributors-shield]: https://img.shields.io/github/contributors/SessionsTechnology/ExpressAcc.svg?style=for-the-badge
[contributors-url]: https://github.com/SessionsTechnology/ExpressAcc/graphs/contributors -->

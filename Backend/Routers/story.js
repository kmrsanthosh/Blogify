const express = require("express")
const imageupload = require("../Helpers/Libraries/imageUpload");

const { getAccessToRoute } = require("../Middlewares/Authorization/auth");
const {addStory,getAllStories,detailStory,likeStory, editStory, deleteStory, editStoryPage,reportStory, deleteStoryIfReportExceeds30} = require("../Controllers/story")
const { checkStoryExist, checkUserAndStoryExist } = require("../Middlewares/database/databaseErrorhandler");



const router = express.Router() ;

router.post("/addstory" ,[getAccessToRoute, imageupload.single("image")],addStory)


router.post("/:slug", checkStoryExist, detailStory)

router.post("/:slug/like",[getAccessToRoute,checkStoryExist] ,likeStory)

router.post("/:slug/report", [getAccessToRoute, checkStoryExist], reportStory);

router.get("/editStory/:slug",[getAccessToRoute,checkStoryExist,checkUserAndStoryExist] , editStoryPage)

router.put("/:slug/edit",[getAccessToRoute,checkStoryExist,checkUserAndStoryExist, imageupload.single("image")] ,editStory)

router.delete("/:slug/delete",[getAccessToRoute,checkStoryExist,checkUserAndStoryExist] ,deleteStory)

router.delete(
    "/:slug/deleteIfReportExceeds30",
    [getAccessToRoute, checkStoryExist],
    deleteStoryIfReportExceeds30
  );
  

router.get("/getAllStories",getAllStories)


module.exports = router
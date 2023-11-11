const asyncErrorWrapper = require("express-async-handler")
const Story = require("../Models/story");
const deleteImageFile = require("../Helpers/Libraries/deleteImageFile");
const {searchHelper, paginateHelper} =require("../Helpers/query/queryHelpers")

const addStory = asyncErrorWrapper(async  (req,res,next)=> {

    const {title,content} = req.body 

    var wordCount = content.trim().split(/\s+/).length ; 
   
    let readtime = Math.floor(wordCount /200)   ;


    try {
        const newStory = await Story.create({
            title,
            content,
            author :req.user._id ,
            image : req.savedStoryImage,
            readtime
        })

        return res.status(200).json({
            success :true ,
            message : "add story successfully ",
            data: newStory
        })
    }

    catch(error) {

        deleteImageFile(req)

        return next(error)
        
    }
  
})

const getAllStories = asyncErrorWrapper( async (req,res,next) =>{

    let query = Story.find();

    query =searchHelper("title",query,req)

    const paginationResult =await paginateHelper(Story , query ,req)

    query = paginationResult.query;

    query = query.sort("-likeCount -commentCount -createdAt")

    const stories = await query
    
    return res.status(200).json(
        {
            success:true,
            count : stories.length,
            data : stories ,
            page : paginationResult.page ,
            pages : paginationResult.pages
        })

})

const detailStory =asyncErrorWrapper(async(req,res,next)=>{

    const {slug}=req.params ;
    const {activeUser} =req.body 

    const story = await Story.findOne({
        slug: slug 
    }).populate("author likes")

    const storyLikeUserIds = story.likes.map(json => json.id)
    const likeStatus = storyLikeUserIds.includes(activeUser._id)


    return res.status(200).
        json({
            success:true,
            data : story,
            likeStatus:likeStatus
        })

})

const likeStory =asyncErrorWrapper(async(req,res,next)=>{

    const {activeUser} =req.body ;
    const {slug} = req.params ;

    const story = await Story.findOne({
        slug: slug 
    }).populate("author likes")
   
    const storyLikeUserIds = story.likes.map(json => json._id.toString())
   
    if (!storyLikeUserIds.includes(activeUser._id)){

        story.likes.push(activeUser)
        story.likeCount = story.likes.length
        await story.save() ; 
    }
    else {

        const index = storyLikeUserIds.indexOf(activeUser._id)
        story.likes.splice(index,1)
        story.likeCount = story.likes.length

        await story.save() ; 
    }
 
    return res.status(200).
    json({
        success:true,
        data : story
    })

})
const reportStory = asyncErrorWrapper(async (req, res, next) => {
    const { slug } = req.params;
    const { activeUser } = req.body;
  
    try {
      const story = await Story.findOne({ slug });
  
      if (!story) {
        return next({
          message: "Story not found",
          statusCode: 404,
        });
      }
  
      if (story.reports.includes(activeUser._id)) {
        // The user has already reported this story
        return res.status(400).json({
          success: false,
          message: "You have already reported this story.",
        });
      }
  
      story.reports.push(activeUser._id);
      story.reportCount = story.reports.length;
      await story.save();
  
      return res.status(200).json({
        success: true,
        message: "Story reported successfully.",
      });
    } catch (error) {
      return next(error);
    }
  });


const editStoryPage  =asyncErrorWrapper(async(req,res,next)=>{
    const { slug } = req.params ; 
   
    const story = await Story.findOne({
        slug: slug 
    }).populate("author likes")

    return res.status(200).
        json({
            success:true,
            data : story
    })
})


const editStory  =asyncErrorWrapper(async(req,res,next)=>{
    const {slug } = req.params ; 
    const {title ,content ,image ,previousImage } = req.body;

    const story = await Story.findOne({slug : slug })

    story.title = title ;
    story.content = content ;
    story.image =   req.savedStoryImage ;

    if( !req.savedStoryImage) {
        // if the image is not sent
        story.image = image
    }
    else {
        // if the image sent
        // old image locatıon delete
       deleteImageFile(req,previousImage)

    }

    await story.save()  ;

    return res.status(200).
        json({
            success:true,
            data :story
    })

})

const deleteStory  =asyncErrorWrapper(async(req,res,next)=>{

    const {slug} = req.params  ;

    const story = await Story.findOne({slug : slug })

    deleteImageFile(req,story.image) ; 

    await story.remove()

    return res.status(200).
        json({
            success:true,
            message : "Story delete succesfully "
    })

})

const deleteStoryIfReportExceeds30 = asyncErrorWrapper(async (req, res, next) => {
    const { slug } = req.params;
    const { activeUser } = req.body;
  
    try {
      const story = await Story.findOne({ slug });
  
      if (!story) {
        return next({
          message: "Story not found",
          statusCode: 404,
        });
      }
  
      // Check if the report count exceeds 30
      if (story.reportCount > 30) {
        // Verify if the user has the necessary privileges to delete
        // For example, only admins can delete in this case
        if (activeUser.role !== "admin") {
          return res.status(403).json({
            success: false,
            message: "Insufficient privileges to delete this story.",
          });
        }
  
        // Delete the story and any associated data
        // Implement a function to delete associated data, like comments, if needed
        await story.remove();
  
        return res.status(200).json({
          success: true,
          message: "Story deleted successfully due to excessive reports.",
        });
      }
  
      return res.status(400).json({
        success: false,
        message: "Report count does not exceed 30. Story not deleted.",
      });
    } catch (error) {
      return next(error);
    }
  });
  



module.exports ={
    addStory,
    getAllStories,
    detailStory,
    likeStory,
    editStoryPage,
    editStory ,
    reportStory,
    deleteStory,
    deleteStoryIfReportExceeds30
}
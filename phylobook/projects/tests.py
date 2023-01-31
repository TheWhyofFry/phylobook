from django.test import TestCase
from .models import Project, ProjectCategory

# Create your tests here.
class ProjectTests(TestCase):
    ''' Tests that projects can be set up correctly '''

    def test_create_project(self):
        ''' Create new project and make sure it's name and tree_node are right '''
       
        my_project = Project(name='My Project')
        my_project.save()

        self.assertEqual(str(my_project), 'My Project')
        self.assertEqual(my_project.tree_node(), [{'My Project': {'depth': 1, 'is_project': True}}])

    def test_add_project_to_category(self):
        ''' Create a category and add our project to it '''
        
        my_category = ProjectCategory.add_root(name='My Category')
        my_category.save()

        # Create a project with no category then add to category
        my_project_1 = Project(name='My Project 1') 
        my_project_1.save()
        my_project_1.category = my_category

        # Create a project with a category
        my_project_2 = Project(name='My Project 2', category = my_category)
        my_project_2.save()

        self.assertEqual(my_category.name, my_project_1.category.name)
        self.assertEqual(my_category.name, my_project_2.category.name)
        # self.assertEqual(my_category.tree_node(), [{'My Category', {'depth': 1, 'is_project': False}}, {'My Project 1', {'depth': 2, 'is_project': True}}, {'My Project 2', {'depth': 2, 'is_project': True}}])
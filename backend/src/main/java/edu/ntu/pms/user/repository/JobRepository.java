package edu.ntu.pms.user.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import edu.ntu.pms.user.entity.Job;

public interface JobRepository extends JpaRepository<Job, Long> {

    List<Job> findAllByOrderByTitleAsc();

    @Query("""
            select distinct j
            from Job j
            left join fetch j.templates t
            left join fetch t.criteria
            order by j.title asc, t.id asc
            """)
    List<Job> findAllWithTemplatesOrderByTitleAsc();
}
